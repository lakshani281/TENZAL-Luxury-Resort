/**
 * User & Profile Management Controller
 * TENZAL Luxury Resort - User Management Module | Student ID: 22CIS0274
 */

const userService = require('../services/userService');
const authService = require('../services/authService');
const {
  validateUpdateProfile,
  validateCreateUser,
  validateRoleUpdate,
  validateStatusUpdate,
} = require('../validators/userValidator');
const { validateChangePassword } = require('../validators/authValidator');

/**
 * GET /api/users/profile
 */
async function getProfile(req, res, next) {
  try {
    const profile = await userService.getUserProfile(req.user.id);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/profile
 */
async function updateProfile(req, res, next) {
  try {
    const validation = validateUpdateProfile(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.errors,
      });
    }

    const updated = await userService.updateUserProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/change-password
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

/**
 * GET /api/users (Admin only)
 */
async function getAllUsers(req, res, next) {
  try {
    const { search, role, status } = req.query;
    const users = await userService.getAllUsers({ search, role, status });
    res.json({
      success: true,
      total: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id (Admin only)
 */
async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(parseInt(req.params.id, 10));
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users (Admin only)
 */
async function createUser(req, res, next) {
  try {
    const validation = validateCreateUser(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.errors,
      });
    }

    const user = await userService.createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User account created successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/:id (Admin only)
 */
async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(parseInt(req.params.id, 10), req.body);
    res.json({
      success: true,
      message: 'User updated successfully.',
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/:id/role (Admin only)
 */
async function updateUserRole(req, res, next) {
  try {
    const validation = validateRoleUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.errors,
      });
    }

    const user = await userService.updateUserRole(parseInt(req.params.id, 10), req.body.role);
    res.json({
      success: true,
      message: `User role updated to ${user.role}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/:id/status (Admin only)
 */
async function updateUserStatus(req, res, next) {
  try {
    const validation = validateStatusUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.errors,
      });
    }

    const user = await userService.updateUserStatus(
      parseInt(req.params.id, 10),
      req.body.is_active,
      req.user.id
    );

    res.json({
      success: true,
      message: `User account has been ${user.is_active ? 'activated' : 'deactivated'}.`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/:id (Admin only)
 */
async function deleteUser(req, res, next) {
  try {
    const result = await userService.deleteUser(parseInt(req.params.id, 10), req.user.id);
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/roles
 */
async function getRoles(_req, res, next) {
  try {
    const roles = await userService.getRoles();
    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getRoles,
};
