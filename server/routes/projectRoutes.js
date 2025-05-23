const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect, student } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    if (file.fieldname === 'zipFile') {
      cb(null, 'uploads/projects');
    } else if (file.fieldname === 'latexFile') {
      cb(null, 'uploads/latex');
    }
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'zipFile') {
    // Allow zip files
    if (file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-zip-compressed' || 
        file.originalname.toLowerCase().endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only zip files are allowed.'), false);
    }
  } else if (file.fieldname === 'latexFile') {
    // For LaTeX files, we need to be more flexible with the validation
    // LaTeX files might not have a standard MIME type, so check extensions
    const validExtensions = ['.tex', '.latex', '.ltx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (validExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only tex files are allowed.'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Set up routes
router.route('/')
  .get(protect, getProjects)
  .post(
    protect, 
    student,
    upload.fields([
      { name: 'zipFile', maxCount: 1 },
      { name: 'latexFile', maxCount: 1 }
    ]),
    createProject
  );

router.route('/:id')
  .get(protect, getProject)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

module.exports = router;