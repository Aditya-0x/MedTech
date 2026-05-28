const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { ensureDbConnected } = require('../config/db');
const { sendWelcomeEmail, sendOtpEmail, sendContactEmail } = require('../services/emailService');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

// In-memory OTP store (email -> { otp, expiresAt })
const otps = new Map();

// Helper to decode JWT from Google
function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (err) {
    return null;
  }
}

// Generate our own JWT for session
const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, name: user.name, picture: user.picture, points: user.points }, JWT_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * POST /api/auth/send-otp
 * Body: { email }
 */
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if user is offline or online
    const dbOnline = await ensureDbConnected();
    let existingUser = false;
    if (dbOnline) {
      const user = await User.findOne({ email: email.toLowerCase() });
      existingUser = !!user;
    } else {
      // In sandbox mode/offline mode, pretend user exists if it contains sandbox
      existingUser = email.toLowerCase().includes('sandbox') || email.toLowerCase().includes('test');
    }

    // Generate secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (dbOnline) {
      // Purge any existing codes for this user to avoid duplication
      await Otp.deleteMany({ email: email.toLowerCase() });
      await Otp.create({ email: email.toLowerCase(), otp: otpCode });
    } else {
      otps.set(email.toLowerCase(), { otp: otpCode, expiresAt });
    }
    console.log(`🔑 OTP generated for ${email}: ${otpCode}`);

    // Send email with OTP
    const emailSent = await sendOtpEmail(email, otpCode);
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
    }

    res.json({ success: true, isNewUser: !existingUser, message: 'Verification code sent!' });
  } catch (err) {
    console.error('❌ Send OTP error:', err.message);
    res.status(500).json({ error: 'Server error while sending verification code' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp, name }
 */
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, name } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const emailKey = email.toLowerCase();
    const dbOnline = await ensureDbConnected();

    let otpVerified = false;

    if (dbOnline) {
      const otpDoc = await Otp.findOne({ email: emailKey });
      if (otpDoc && otpDoc.otp === otp.trim()) {
        otpVerified = true;
        // Purge the used code immediately
        await Otp.deleteOne({ _id: otpDoc._id });
      }
    }

    // Fallback to local memory map verification if database did not have it
    if (!otpVerified) {
      const otpEntry = otps.get(emailKey);
      if (otpEntry) {
        if (otpEntry.otp === otp.trim() && Date.now() <= otpEntry.expiresAt) {
          otpVerified = true;
          otps.delete(emailKey);
        }
      }
    }

    if (!otpVerified) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please check your email and try again.' });
    }

    if (!dbOnline) {
      console.warn('⚠️ MongoDB is offline. Generating mock user session for testing.');
      const mockUser = {
        _id: 'mock-id-' + Math.floor(Math.random() * 10000),
        name: name || 'Sandbox Clinician',
        email: emailKey,
        points: 0,
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&q=80'
      };
      const token = generateToken(mockUser);
      return res.json({ success: true, token, user: mockUser });
    }

    // Find or create the user in MongoDB
    let user = await User.findOne({ email: emailKey });
    let isNewUser = false;

    if (!user) {
      if (!name) {
        return res.status(400).json({ error: 'Profile name is required to complete registration.' });
      }
      user = await User.create({
        name: name.trim(),
        email: emailKey,
        points: 0
      });
      isNewUser = true;
      // Send welcome email
      await sendWelcomeEmail(user.email, user.name);
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
        picture: user.picture
      }
    });

  } catch (err) {
    console.error('❌ Verify OTP error:', err.message);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

/**
 * POST /api/auth/google
 */
router.post('/auth/google', async (req, res) => {
  try {
    const { credential, mockProfile } = req.body;

    let payloadData = null;

    if (mockProfile) {
      payloadData = {
        sub: mockProfile.id || 'mock-id-123',
        email: mockProfile.email || 'guest@medverify.pro',
        name: mockProfile.name || 'Dr. Guest Clinician',
        picture: mockProfile.picture || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&h=120&fit=crop&q=80',
      };
    } else if (credential) {
      const decoded = decodeJwt(credential);
      if (!decoded) return res.status(400).json({ error: 'Invalid Google identity token' });
      
      const nowSecs = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < nowSecs) return res.status(400).json({ error: 'Token has expired' });
      
      payloadData = decoded;
    } else {
      return res.status(400).json({ error: 'Missing credential token' });
    }

    const dbOnline = await ensureDbConnected();
    if (!dbOnline) {
      console.warn('⚠️ MongoDB is offline. Serving mock Google OAuth sandbox session.');
      const mockUser = { _id: payloadData.sub, name: payloadData.name, email: payloadData.email, points: 0, picture: payloadData.picture };
      return res.json({ success: true, token: generateToken(mockUser), user: mockUser });
    }

    // Find or create user in MongoDB
    let user = await User.findOne({ email: payloadData.email });
    
    if (!user) {
      user = await User.create({
        name: payloadData.name,
        email: payloadData.email,
        googleId: payloadData.sub,
        picture: payloadData.picture,
        points: 0
      });
      // Send Welcome Email securely and await it so it completes fully in serverless (Vercel) environments
      await sendWelcomeEmail(user.email, user.name);
    } else if (!user.googleId) {
      // Link Google ID if they previously signed up with email
      user.googleId = payloadData.sub;
      await user.save();
    }

    const token = generateToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, points: user.points, picture: user.picture } });
  } catch (err) {
    res.status(500).json({ error: 'Server error during Google auth' });
  }
});

/**
 * GET /api/auth/me
 * Returns the latest user profile and points
 */
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid session' });
  }
};

router.get('/auth/me', authenticateToken, async (req, res) => {
  const dbOnline = await ensureDbConnected();
  if (!dbOnline) {
    return res.json({ success: true, user: req.user });
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, points: user.points, picture: user.picture } });
});

/**
 * POST /api/contact
 * Body: { name, email, subject, message }
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const emailSent = await sendContactEmail(name, email, subject, message);
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to submit contact request. Please try again.' });
    }

    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (err) {
    console.error('❌ Contact route error:', err.message);
    res.status(500).json({ error: 'Server error while sending feedback' });
  }
});

module.exports = {
  router,
  authenticateToken,
  JWT_SECRET
};
