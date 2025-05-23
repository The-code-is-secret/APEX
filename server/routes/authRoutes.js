const express = require('express');
const {
  registerUser,
  loginStudent,
  loginAdmin,
  getMe,
  logout,
  refreshToken
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/student/login', loginStudent);
router.post('/admin/login', loginAdmin);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);

module.exports = router;