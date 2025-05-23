const Project = require('../models/Project');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get all projects (for students: only their own projects)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let query = {};
    
    // If user is a student, only return their projects
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }
    
    // Allow filtering by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Execute query
    const projects = await Project.find(query)
      .populate('student', 'username rollNo')
      .populate('reviewedBy', 'username email')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);
    
    // Get total count
    const total = await Project.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: projects.length,
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

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('student', 'username rollNo')
      .populate('reviewedBy', 'username email');
    
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    
    // Check if user has permission to view this project
    if (req.user.role === 'student' && project.student._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Student only)
const createProject = async (req, res, next) => {
  try {
    // Only students can create projects
    if (req.user.role !== 'student') {
      res.status(403);
      throw new Error('Only students can create projects');
    }
    
    // Check if files were uploaded
    if (!req.files || !req.files.zipFile || !req.files.zipFile.length === 0 || 
        !req.files.latexFile || !req.files.latexFile.length === 0) {
      res.status(400);
      throw new Error('Please upload both project zip and LaTeX files');
    }
    
    const { name, description, stack } = req.body;
    
    // Safely parse stack
    let parsedStack = [];
    try {
      parsedStack = stack ? JSON.parse(stack) : [];
    } catch (err) {
      console.error('Error parsing stack:', err);
      res.status(400);
      throw new Error('Invalid stack format');
    }
    
    // Create project
    const project = await Project.create({
      name,
      description,
      student: req.user._id,
      stack: parsedStack,
      latexFilePath: req.files.latexFile[0].path,
      zipFilePath: req.files.zipFile[0].path,
      status: 'submitted'
    });
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    // Delete uploaded files if project creation fails
    if (req.files) {
      if (req.files.zipFile && req.files.zipFile[0]) {
        fs.unlinkSync(req.files.zipFile[0].path);
      }
      if (req.files.latexFile && req.files.latexFile[0]) {
        fs.unlinkSync(req.files.latexFile[0].path);
      }
    }
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Student: limited fields, Admin: all fields)
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    
    // Check permissions
    if (req.user.role === 'student') {
      // Students can only update their own projects
      if (project.student.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this project');
      }
      
      // Students can only update certain fields
      const { name, description, stack } = req.body;
      const updateData = { name, description };
      
      if (stack) {
        updateData.stack = typeof stack === 'string' ? JSON.parse(stack) : stack;
      }
      
      project = await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
    } else if (req.user.role === 'admin') {
      // Admins can update status and review comments
      const { status, reviewComments } = req.body;
      
      project = await Project.findByIdAndUpdate(
        req.params.id,
        {
          status,
          reviewComments,
          reviewedBy: req.user._id,
          reviewedAt: Date.now()
        },
        { new: true, runValidators: true }
      );
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Student: own projects, Admin: any project)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }
    
    // Check permissions
    if (req.user.role === 'student' && project.student.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this project');
    }
    
    // Delete associated files
    if (fs.existsSync(project.zipFilePath)) {
      fs.unlinkSync(project.zipFilePath);
    }
    
    if (fs.existsSync(project.latexFilePath)) {
      fs.unlinkSync(project.latexFilePath);
    }
    
    // Delete extracted files if they exist
    if (project.extractedPath && fs.existsSync(project.extractedPath)) {
      fs.rmdirSync(project.extractedPath, { recursive: true });
    }
    
    await project.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
};