const db = require('../config/db');

/**
 * Category Model
 * Handles data access operations for food_categories table.
 */
class CategoryModel {
  /**
   * Find all food categories.
   * By default, returns only active categories (is_active = true).
   * If includeInactive is true, returns both active and inactive categories.
   * Sorted by display_order ASC, then name ASC.
   *
   * @param {Object} options
   * @param {boolean} [options.includeInactive=false]
   * @returns {Promise<Array>}
   */
  static async findAll({ includeInactive = false } = {}) {
    let queryText = `
      SELECT 
        category_id,
        name,
        slug,
        description,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM food_categories
    `;
    const params = [];

    if (!includeInactive) {
      params.push(true);
      queryText += ` WHERE is_active = $${params.length}`;
    }

    queryText += ` ORDER BY display_order ASC, name ASC;`;

    const { rows } = await db.query(queryText, params);
    return rows;
  }

  /**
   * Find category by primary key (category_id).
   *
   * @param {number} categoryId
   * @returns {Promise<Object|null>}
   */
  static async findById(categoryId) {
    const queryText = `
      SELECT 
        category_id,
        name,
        slug,
        description,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM food_categories
      WHERE category_id = $1;
    `;
    const { rows } = await db.query(queryText, [categoryId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find category by unique slug.
   *
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async findBySlug(slug) {
    const queryText = `
      SELECT 
        category_id,
        name,
        slug,
        description,
        display_order,
        is_active,
        created_at,
        updated_at
      FROM food_categories
      WHERE LOWER(slug) = LOWER($1);
    `;
    const { rows } = await db.query(queryText, [slug]);
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = CategoryModel;
