const Project = require('../models/Project');
const TerminalSession = require('../models/TerminalSession');
const dockerService = require('../services/dockerService');

// @desc    Get all projects with detailed stats
// @route   GET /api/admin/projects
// @access  Private (Admin only)
const getAdminProjects = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by student if provided
    if (req.query.student) {
      query.student = req.query.student;
    }
    
    // Search functionality
    if (req.query.search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      };
    }
    
    // Execute query
    const projects = await Project.find(query)
      .populate('student', 'username rollNo')
      .populate('reviewedBy', 'username email')
      .sort(req.query.sort || '-createdAt')
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await Project.countDocuments(query);
    
    // Get status counts for dashboard
    const statusCounts = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const stats = {
      total,
      submitted: 0,
      reviewed: 0,
      pending: 0
    };
    
    statusCounts.forEach(item => {
      stats[item._id] = item.count;
    });
    
    res.status(200).json({
      success: true,
      stats,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review a project
// @route   PUT /api/admin/projects/:id/review
// @access  Private (Admin only)
const reviewProject = async (req, res, next) => {
  try {
    const { status, reviewComments } = req.body;
    
    if (!status || !['submitted', 'reviewed', 'pending'].includes(status)) {
      res.status(400);
      throw new Error('Please provide a valid status');
    }
    
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    
    // Update project with review data
    project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewComments,
        reviewedBy: req.user._id,
        reviewedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('student', 'username rollNo');
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a terminal session for a project
// @route   POST /api/admin/terminal/:projectId/start
// @access  Private (Admin only)
const startTerminalSession = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check Docker availability first
    const isDockerRunning = await dockerService.checkDockerRunning();
    if (!isDockerRunning) {
      return res.status(500).json({
        success: false,
        message: 'Docker service unavailable. Please contact system administrator.'
      });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    
    // Check if there's already an active session
    const existingSession = await TerminalSession.findOne({
      project: projectId,
      admin: req.user._id,
      status: 'active'
    });
    
    if (existingSession) {
      return res.status(200).json({
        success: true,
        message: 'Terminal session already exists',
        data: {
          sessionId: existingSession._id
        }
      });
    }
    
    // Start new container and session
    const session = await dockerService.startContainer(projectId, req.user._id);
    
    res.status(201).json({
      success: true,
      message: 'Terminal session started successfully',
      data: {
        sessionId: session.sessionId
      }
    });
  } catch (error) {
    console.error('Terminal session start error:', error);
    res.status(500).json({
      message: error.message || 'Failed to start terminal session',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
};

// @desc    Terminate a terminal session
// @route   POST /api/admin/terminal/:sessionId/terminate
// @access  Private (Admin only)
const terminateTerminalSession = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    
    // Check if session exists and belongs to this admin
    const session = await TerminalSession.findOne({
      _id: sessionId,
      admin: req.user._id
    });
    
    if (!session) {
      res.status(404);
      throw new Error('Terminal session not found');
    }
    
    // Terminate container
    const result = await dockerService.terminateContainer(sessionId);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active terminal sessions for admin
// @route   GET /api/admin/terminal/sessions
// @access  Private (Admin only)
const getTerminalSessions = async (req, res, next) => {
  try {
    const sessions = await TerminalSession.find({
      admin: req.user._id,
      status: 'active'
    }).populate({
      path: 'project',
      select: 'name student',
      populate: {
        path: 'student',
        select: 'username rollNo'
      }
    });
    
    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminProjects,
  reviewProject,
  startTerminalSession,
  terminateTerminalSession,
  getTerminalSessions
};