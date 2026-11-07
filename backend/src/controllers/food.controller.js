const Category = require('../models/category.model');
const FoodItem = require('../models/foodItem.model');

/**
 * Controller: Get Food Categories
 * GET /api/food/categories
 *
 * Query Parameters:
 * - all: boolean string ('true' to include inactive categories, defaults to false)
 */
async function getCategories(req, res) {
  try {
    const includeInactive = String(req.query.all || '').trim().toLowerCase() === 'true';
    const categories = await Category.findAll({ includeInactive });

    return res.status(200).json({
      status: 'success',
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Error in getCategories:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve food categories. Please try again later.',
    });
  }
}

/**
 * Controller: Get Food Items
 * GET /api/food/items
 *
 * Query Parameters:
 * - category_id: positive integer filter
 * - category_slug: string filter
 * - available: 'true', 'false', or 'all' (default: 'true')
 * - search / q: search across name, subtitle, and description
 */
async function getFoodItems(req, res) {
  try {
    let categoryId;
    if (req.query.category_id !== undefined) {
      const rawCatId = String(req.query.category_id).trim();
      const parsedCatId = Number(rawCatId);
      if (!/^\d+$/.test(rawCatId) || !Number.isInteger(parsedCatId) || parsedCatId <= 0) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid category_id parameter. Must be a positive integer.',
        });
      }
      categoryId = parsedCatId;
    }

    let categorySlug;
    if (req.query.category_slug !== undefined) {
      const rawSlug = String(req.query.category_slug).trim();
      if (!rawSlug) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid category_slug parameter. Cannot be empty.',
        });
      }
      categorySlug = rawSlug;
    }

    let available = 'true';
    if (req.query.available !== undefined) {
      const rawAvail = String(req.query.available).trim().toLowerCase();
      if (!['true', 'false', 'all'].includes(rawAvail)) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: "Invalid available parameter. Allowed values are 'true', 'false', or 'all'.",
        });
      }
      available = rawAvail;
    }

    let search;
    const rawSearch = req.query.search !== undefined ? req.query.search : req.query.q;
    if (rawSearch !== undefined) {
      if (typeof rawSearch !== 'string') {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid search parameter. Must be a string.',
        });
      }
      const trimmedSearch = rawSearch.trim();
      if (trimmedSearch.length > 0) {
        search = trimmedSearch;
      }
    }

    const items = await FoodItem.findAll({
      categoryId,
      categorySlug,
      available,
      search,
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error in getFoodItems:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve food items. Please try again later.',
    });
  }
}

/**
 * Controller: Get Single Food Item by ID
 * GET /api/food/items/:id
 *
 * Route Parameters:
 * - id: positive integer
 */
async function getFoodItemById(req, res) {
  try {
    const rawId = req.params.id;
    const parsedId = Number(rawId);

    if (!rawId || !/^\d+$/.test(String(rawId).trim()) || !Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid food item ID. ID must be a positive integer.',
      });
    }

    const item = await FoodItem.findById(parsedId);

    if (!item) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: `Food item with ID ${parsedId} not found.`,
      });
    }

    return res.status(200).json({
      status: 'success',
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error in getFoodItemById:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve food item. Please try again later.',
    });
  }
}

/**
 * Controller: Get Active Daily Specials
 * GET /api/food/specials
 *
 * Query Parameters:
 * - category_id: optional positive integer
 * - category_slug: optional string
 */
async function getDailySpecials(req, res) {
  try {
    let categoryId;
    if (req.query.category_id !== undefined) {
      const rawCatId = String(req.query.category_id).trim();
      const parsedCatId = Number(rawCatId);
      if (!/^\d+$/.test(rawCatId) || !Number.isInteger(parsedCatId) || parsedCatId <= 0) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid category_id parameter. Must be a positive integer.',
        });
      }
      categoryId = parsedCatId;
    }

    let categorySlug;
    if (req.query.category_slug !== undefined) {
      const rawSlug = String(req.query.category_slug).trim();
      if (!rawSlug) {
        return res.status(400).json({
          status: 'error',
          success: false,
          message: 'Invalid category_slug parameter. Cannot be empty.',
        });
      }
      categorySlug = rawSlug;
    }

    const specials = await FoodItem.findDailySpecials({
      categoryId,
      categorySlug,
    });

    return res.status(200).json({
      status: 'success',
      success: true,
      count: specials.length,
      data: specials,
    });
  } catch (error) {
    console.error('Error in getDailySpecials:', error.message);
    return res.status(500).json({
      status: 'error',
      success: false,
      message: 'Failed to retrieve daily specials. Please try again later.',
    });
  }
}

module.exports = {
  getCategories,
  getFoodItems,
  getFoodItemById,
  getDailySpecials,
};
