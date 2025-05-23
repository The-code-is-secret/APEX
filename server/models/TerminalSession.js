const mongoose = require('mongoose');

const TerminalSessionSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  containerId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'terminated'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  logs: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TerminalSession', TerminalSessionSchema);