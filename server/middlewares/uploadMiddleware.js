const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directories if they don't exist
const createDirs = () => {
  const dirs = ['uploads/projects', 'uploads/latex'];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirs();

// Configure storage for project zip files
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/projects');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure storage for LaTeX files
const latexStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/latex');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `latex-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for zip files
const zipFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    return cb(null, true);
  }
  
  cb(new Error('Only zip files are allowed!'));
};

// File filter for LaTeX files
const latexFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.tex', '.latex'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    return cb(null, true);
  }
  
  cb(new Error('Only LaTeX files are allowed!'));
};

// Multer upload configurations
const uploadProject = multer({
  storage: projectStorage,
  fileFilter: zipFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
}).single('zipFile');

const uploadLatex = multer({
  storage: latexStorage,
  fileFilter: latexFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max file size
}).single('latexFile');

// Middleware wrappers
const uploadProjectMiddleware = (req, res, next) => {
  uploadProject(req, res, (err) => {
    if (err) {
      res.status(400);
      next(err);
      return;
    }
    next();
  });
};

const uploadLatexMiddleware = (req, res, next) => {
  uploadLatex(req, res, (err) => {
    if (err) {
      res.status(400);
      next(err);
      return;
    }
    next();
  });
};

module.exports = {
  uploadProjectMiddleware,
  uploadLatexMiddleware
};