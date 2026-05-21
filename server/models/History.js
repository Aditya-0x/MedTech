const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  claim: {
    type: String,
    required: true,
  },
  verdict: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  confidence: {
    type: String,
  },
  synthesis: {
    type: String,
  },
  sources: {
    type: Array,
    default: [],
  },
  savedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('History', HistorySchema);
