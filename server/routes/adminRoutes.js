const express = require('express');
const {
  getAdminProjects,
  reviewProject,
  startTerminalSession,
  terminateTerminalSession,
  getTerminalSessions
} = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, admin);

// Project management routes
router.get('/projects', getAdminProjects);
router.put('/projects/:id/review', reviewProject);

// Terminal management routes
router.post('/terminal/:projectId/start', startTerminalSession);
router.post('/terminal/:sessionId/terminate', terminateTerminalSession);
router.get('/terminal/sessions', getTerminalSessions);

module.exports = router;