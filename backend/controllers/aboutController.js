/**
 * About Us Content Controller
 * TENZAL Luxury Resort - User Management & About Us Module | Student ID: 22CIS0274
 */

const aboutService = require('../services/aboutService');
const { validateAboutContent } = require('../validators/aboutValidator');

/**
 * GET /api/about (Public)
 */
async function getAboutContent(_req, res, next) {
  try {
    const content = await aboutService.getAboutContent();
    res.json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/about (Admin only)
 */
async function updateAboutContent(req, res, next) {
  try {
    const validation = validateAboutContent(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validation.errors,
      });
    }

    const updated = await aboutService.updateAboutContent(req.user.id, req.body);
    res.json({
      success: true,
      message: 'Resort story & About Us content updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAboutContent,
  updateAboutContent,
};
