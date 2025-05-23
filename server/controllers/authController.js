const User = require('../models/User');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, password, role, rollNo, email } = req.body;

    // Check if user exists
    let user;
    if (role === 'student') {
      user = await User.findOne({ rollNo });
      if (user) {
        res.status(400);
        throw new Error('Student with this Roll Number already exists');
      }
    } else if (role === 'admin') {
      user = await User.findOne({ email });
      if (user) {
        res.status(400);
        throw new Error('Admin with this email already exists');
      }
    }

    // Create user
    user = await User.create({
      username,
      password,
      role,
      rollNo: role === 'student' ? rollNo : undefined,
      email: role === 'admin' ? email : undefined
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login student
// @route   POST /api/auth/student/login
// @access  Public
const loginStudent = async (req, res, next) => {
  try {
    const { rollNo, password } = req.body;

    // Validate rollNo & password
    if (!rollNo || !password) {
      res.status(400);
      throw new Error('Please provide roll number and password');
    }

    // Check for user
    const user = await User.findOne({ rollNo, role: 'student' }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login admin
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Check for user
    const user = await User.findOne({ email, role: 'admin' }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      rollNo: user.rollNo,
      email: user.email
    }
  });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400);
      throw new Error('Please provide refresh token');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Get user from decoded token
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    // Generate new access token
    const newToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token: newToken
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginStudent,
  loginAdmin,
  getMe,
  logout,
  refreshToken
};