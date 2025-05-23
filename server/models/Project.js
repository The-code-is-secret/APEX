const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a project name'],
    trim: true,
    maxlength: [100, 'Project name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a project description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stack: {
    type: [String],
    required: [true, 'Please specify the technology stack']
  },
  latexFilePath: {
    type: String,
    required: [true, 'LaTeX file is required']
  },
  zipFilePath: {
    type: String,
    required: [true, 'Project zip file is required']
  },
  extractedPath: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'pending'],
    default: 'submitted'
  },
  reviewComments: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Add index for fast querying
ProjectSchema.index({ student: 1 });
ProjectSchema.index({ status: 1 });

module.exports = mongoose.model('Project', ProjectSchema);