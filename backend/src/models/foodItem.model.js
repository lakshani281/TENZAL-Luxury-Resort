const db = require('../config/db');

/**
 * Format database row into standard FoodItem entity.
 * Keeps numeric price accurate and provides both flat and structured category details.
 *
 * @param {Object} row
 * @returns {Object}
 */
function formatFoodItem(row) {
  if (!row) return null;

  return {
    item_id: row.item_id,
    category_id: row.category_id,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    price: row.price !== null && row.price !== undefined ? parseFloat(row.price) : 0,
    prep_time_minutes: row.prep_time_minutes,
    image_url: row.image_url,
    is_available: row.is_available,
    is_special: row.is_special,
    special_badge: row.special_badge,
    special_start_at: row.special_start_at,
    special_end_at: row.special_end_at,
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    category_name: row.category_name,
    category_slug: row.category_slug,
    category: row.category_id
      ? {
          category_id: row.category_id,
          name: row.category_name,
          slug: row.category_slug,
          description: row.category_description || null,
          display_order: row.category_display_order,
          is_active: row.category_is_active,
        }
      : null,
  };
}

/**
 * Food Item Model
 * Handles data access operations for food_items joined with food_categories.
 */
class FoodItemModel {
  /**
   * Find food items with filtering and search support.
   * Excludes items belonging to inactive categories (fc.is_active = TRUE).
   *
   * @param {Object} options
   * @param {number} [options.categoryId] - Filter by specific category_id
   * @param {string} [options.categorySlug] - Filter by category slug
   * @param {string} [options.available='true'] - 'true', 'false', or 'all'
   * @param {string} [options.search] - Case-insensitive search across name, subtitle, description
   * @returns {Promise<Array>}
   */
  static async findAll({ categoryId, categorySlug, available = 'true', search } = {}) {
    let queryText = `
      SELECT 
        fi.item_id,
        fi.category_id,
        fi.name,
        fi.subtitle,
        fi.description,
        fi.price,
        fi.prep_time_minutes,
        fi.image_url,
        fi.is_available,
        fi.is_special,
        fi.special_badge,
        fi.special_start_at,
        fi.special_end_at,
        fi.ingredients,
        fi.created_at,
        fi.updated_at,
        fc.name AS category_name,
        fc.slug AS category_slug,
        fc.description AS category_description,
        fc.display_order AS category_display_order,
        fc.is_active AS category_is_active
      FROM food_items fi
      JOIN food_categories fc ON fi.category_id = fc.category_id
      WHERE fc.is_active = TRUE
    `;

    const params = [];

    // Filter by category_id
    if (categoryId !== undefined && categoryId !== null) {
      params.push(categoryId);
      queryText += ` AND fi.category_id = $${params.length}`;
    }

    // Filter by category_slug
    if (categorySlug) {
      params.push(categorySlug.toLowerCase());
      queryText += ` AND LOWER(fc.slug) = $${params.length}`;
    }

    // Filter by availability (defaults to available=true)
    if (available === 'true') {
      queryText += ` AND fi.is_available = TRUE`;
    } else if (available === 'false') {
      queryText += ` AND fi.is_available = FALSE`;
    }
    // Note: if available === 'all', no condition on fi.is_available is added.

    // Search across name, subtitle, and description using parameterized ILIKE
    if (search && search.trim().length > 0) {
      params.push(`%${search.trim()}%`);
      const searchParamIdx = params.length;
      queryText += ` AND (
        fi.name ILIKE $${searchParamIdx} 
        OR fi.subtitle ILIKE $${searchParamIdx} 
        OR fi.description ILIKE $${searchParamIdx}
      )`;
    }

    queryText += ` ORDER BY fc.display_order ASC, fi.name ASC, fi.item_id ASC;`;

    const { rows } = await db.query(queryText, params);
    return rows.map(formatFoodItem);
  }

  /**
   * Find a single food item by its primary key (item_id).
   * Includes joined category information.
   *
   * @param {number} itemId - Positive integer
   * @returns {Promise<Object|null>}
   */
  static async findById(itemId) {
    const queryText = `
      SELECT 
        fi.item_id,
        fi.category_id,
        fi.name,
        fi.subtitle,
        fi.description,
        fi.price,
        fi.prep_time_minutes,
        fi.image_url,
        fi.is_available,
        fi.is_special,
        fi.special_badge,
        fi.special_start_at,
        fi.special_end_at,
        fi.ingredients,
        fi.created_at,
        fi.updated_at,
        fc.name AS category_name,
        fc.slug AS category_slug,
        fc.description AS category_description,
        fc.display_order AS category_display_order,
        fc.is_active AS category_is_active
      FROM food_items fi
      JOIN food_categories fc ON fi.category_id = fc.category_id
      WHERE fi.item_id = $1;
    `;

    const { rows } = await db.query(queryText, [itemId]);
    return rows.length > 0 ? formatFoodItem(rows[0]) : null;
  }

  /**
   * Find active daily specials.
   * Only returns available items flagged as specials whose active window
   * (special_start_at and special_end_at) includes CURRENT_TIMESTAMP.
   * Excludes inactive categories.
   *
   * @param {Object} [options]
   * @param {number} [options.categoryId]
   * @param {string} [options.categorySlug]
   * @returns {Promise<Array>}
   */
  static async findDailySpecials({ categoryId, categorySlug } = {}) {
    let queryText = `
      SELECT 
        fi.item_id,
        fi.category_id,
        fi.name,
        fi.subtitle,
        fi.description,
        fi.price,
        fi.prep_time_minutes,
        fi.image_url,
        fi.is_available,
        fi.is_special,
        fi.special_badge,
        fi.special_start_at,
        fi.special_end_at,
        fi.ingredients,
        fi.created_at,
        fi.updated_at,
        fc.name AS category_name,
        fc.slug AS category_slug,
        fc.description AS category_description,
        fc.display_order AS category_display_order,
        fc.is_active AS category_is_active
      FROM food_items fi
      JOIN food_categories fc ON fi.category_id = fc.category_id
      WHERE fi.is_special = TRUE
        AND fi.is_available = TRUE
        AND fc.is_active = TRUE
        AND (fi.special_start_at IS NULL OR fi.special_start_at <= CURRENT_TIMESTAMP)
        AND (fi.special_end_at IS NULL OR fi.special_end_at >= CURRENT_TIMESTAMP)
    `;

    const params = [];

    if (categoryId !== undefined && categoryId !== null) {
      params.push(categoryId);
      queryText += ` AND fi.category_id = $${params.length}`;
    }

    if (categorySlug) {
      params.push(categorySlug.toLowerCase());
      queryText += ` AND LOWER(fc.slug) = $${params.length}`;
    }

    queryText += ` ORDER BY fc.display_order ASC, fi.name ASC, fi.item_id ASC;`;

    const { rows } = await db.query(queryText, params);
    return rows.map(formatFoodItem);
  }
}

module.exports = FoodItemModel;
