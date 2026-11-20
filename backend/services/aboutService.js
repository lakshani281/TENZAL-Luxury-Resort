/**
 * About Us Content Service
 * TENZAL Luxury Resort - User Management & About Us Module | Student ID: 22CIS0274
 */

const db = require('../config/db');

/**
 * Get About Us resort editorial content
 */
async function getAboutContent() {
  const res = await db.query(
    `SELECT a.id, a.title, a.intro, a.content, a.status, a.updated_at,
            u.name AS updated_by_name
     FROM about_content a
     LEFT JOIN users u ON a.updated_by = u.id
     ORDER BY a.id ASC
     LIMIT 1`
  );

  if (!res.rows || res.rows.length === 0) {
    return {
      id: 1,
      title: 'About TENZAL Luxury Boutique Resort',
      intro: 'A quiet boutique retreat in the misty hills of Haputale, Sri Lanka.',
      content:
        'Nestled amidst the emerald slopes of Haputale, TENZAL Luxury Boutique Resort is a tranquil sanctuary of serenity and elegance. Perched high above the clouds with panoramic vistas of the rolling Uva valley, we combine authentic Sri Lankan hospitality with refined contemporary luxury. Every suite is thoughtfully curated with local timber furnishings, deep-soaking bathtubs, private misty balconies, and warm personalized service.',
      status: 'published',
      updated_at: new Date(),
    };
  }

  return res.rows[0];
}

/**
 * Update About Us content (Admin only)
 */
async function updateAboutContent(userId, { title, intro, content, status }) {
  const current = await getAboutContent();

  const newTitle = title !== undefined ? title.trim() : current.title;
  const newIntro = intro !== undefined ? intro.trim() : current.intro;
  const newContent = content !== undefined ? content.trim() : current.content;
  const newStatus = status !== undefined ? status : current.status;

  const res = await db.query(
    `UPDATE about_content
     SET title = $1, intro = $2, content = $3, status = $4, updated_by = $5, updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [newTitle, newIntro, newContent, newStatus, userId, current.id || 1]
  );

  return res.rows && res.rows.length > 0 ? res.rows[0] : current;
}

module.exports = {
  getAboutContent,
  updateAboutContent,
};
