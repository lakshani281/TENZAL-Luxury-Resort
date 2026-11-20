/**
 * Authentication Controller
 * TENZAL Luxury Resort - User Management Module | Student ID: 22CIS0274
 */

const authService = require('../services/authService');
const { validateRegister, validateLogin, validateChangePassword } = require('../validators/authValidator');

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const validation = validateRegister(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.errors,
      });
    }

    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const validation = validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.errors,
      });
    }

    const result = await authService.login(req.body);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(_req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully. Please clear your local session tokens.',
  });
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    // Current valid token refresh
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to refresh session.',
      });
    }

    const newToken = authService.generateToken({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      role_id: req.user.role_id,
    });

    res.json({
      success: true,
      message: 'Session token refreshed.',
      data: { token: newToken },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const validation = validateChangePassword(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.errors,
      });
    }

    const result = await authService.changePassword(req.user.id, req.body);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
};
