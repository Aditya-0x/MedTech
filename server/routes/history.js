const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureDbConnected } = require('../config/db');
const { authenticateToken } = require('./auth');
const History = require('../models/History');
const User = require('../models/User');

// In-memory verification history store indexed by user email / ID (Fallback)
const userHistoryFallback = new Map();

/**
 * GET /api/history
 * Returns the logged-in user's verification history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const dbOnline = await ensureDbConnected();

    if (!dbOnline) {
      console.warn('⚠️ MongoDB not connected. Serving history from in-memory fallback store.');
      const history = userHistoryFallback.get(userId) || [];
      return res.json({ success: true, history });
    }

    const history = await History.find({ userId }).sort({ savedAt: -1 }).limit(50);
    res.json({ success: true, history });
  } catch (err) {
    console.error('⚠️ Error fetching history, falling back to memory:', err.message);
    const userId = req.user?.id;
    const history = userId ? (userHistoryFallback.get(userId) || []) : [];
    res.json({ success: true, history });
  }
});

/**
 * POST /api/history
 * Saves a verification report into the user's history and awards points!
 */
router.post('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { report } = req.body;

    if (!report) {
      return res.status(400).json({ error: 'No report payload provided' });
    }

    const POINTS_REWARD = 15;
    const enrichedReport = {
      ...report,
      id: report.id || `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      savedAt: new Date().toISOString()
    };

    const dbOnline = await ensureDbConnected();

    if (!dbOnline) {
      if (!userHistoryFallback.has(userId)) userHistoryFallback.set(userId, []);
      const history = userHistoryFallback.get(userId);
      history.unshift(enrichedReport);
      if (history.length > 50) history.pop();
      userHistoryFallback.set(userId, history);
      
      // Simulate point addition for UI in mock mode
      const simulatedNewPoints = (req.user.points || 0) + POINTS_REWARD;
      req.user.points = simulatedNewPoints; // mutate for current session
      
      return res.json({ success: true, report: enrichedReport, pointsAwarded: POINTS_REWARD, newTotalPoints: simulatedNewPoints });
    }

    // Save to MongoDB
    await History.create({
      userId,
      claim: report.claim,
      verdict: report.verdict,
      confidence: report.confidence,
      synthesis: report.synthesis,
      sources: report.sources,
      savedAt: enrichedReport.savedAt
    });

    // Enforce max 50 items per user by deleting oldest if exceeded
    const count = await History.countDocuments({ userId });
    if (count > 50) {
      const oldest = await History.find({ userId }).sort({ savedAt: 1 }).limit(count - 50);
      const oldestIds = oldest.map(doc => doc._id);
      await History.deleteMany({ _id: { $in: oldestIds } });
    }

    // Award Gamification Points
    const user = await User.findById(userId);
    if (user) {
      user.points += POINTS_REWARD;
      await user.save();
    }

    res.json({ success: true, report: enrichedReport, pointsAwarded: POINTS_REWARD, newTotalPoints: user ? user.points : 0 });
  } catch (err) {
    console.error('❌ Error saving history, falling back to memory:', err);
    try {
      const userId = req.user.id;
      const { report } = req.body;
      const POINTS_REWARD = 15;
      const enrichedReport = {
        ...report,
        id: report?.id || `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        savedAt: new Date().toISOString()
      };
      if (!userHistoryFallback.has(userId)) userHistoryFallback.set(userId, []);
      const history = userHistoryFallback.get(userId);
      history.unshift(enrichedReport);
      if (history.length > 50) history.pop();
      userHistoryFallback.set(userId, history);
      const simulatedNewPoints = (req.user.points || 0) + POINTS_REWARD;
      req.user.points = simulatedNewPoints;
      return res.json({ success: true, report: enrichedReport, pointsAwarded: POINTS_REWARD, newTotalPoints: simulatedNewPoints });
    } catch (fallbackErr) {
      res.status(500).json({ error: 'Server error saving history', details: err.message });
    }
  }
});

/**
 * DELETE /api/history/:id
 * Removes a specific verified report from the user's sandbox
 */
router.delete('/history/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;

    const dbOnline = await ensureDbConnected();

    if (!dbOnline) {
      const history = userHistoryFallback.get(userId) || [];
      const updatedHistory = history.filter(r => r.id !== reportId);
      userHistoryFallback.set(userId, updatedHistory);
      return res.json({ success: true, message: 'Report successfully removed from your sandbox' });
    }

    await History.findOneAndDelete({ _id: reportId, userId });
    res.json({ success: true, message: 'Report successfully deleted from your history' });
  } catch (err) {
    console.error('❌ Error deleting history, falling back to memory:', err);
    const userId = req.user?.id;
    const reportId = req.params.id;
    if (userId) {
      const history = userHistoryFallback.get(userId) || [];
      const updatedHistory = history.filter(r => r.id !== reportId);
      userHistoryFallback.set(userId, updatedHistory);
    }
    res.json({ success: true, message: 'Report successfully removed from your sandbox' });
  }
});

module.exports = router;
