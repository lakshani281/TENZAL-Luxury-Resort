/**
 * Input Validator for About Content
 * TENZAL Luxury Resort - User Management & About Us Module | Student ID: 22CIS0274
 */

function validateAboutContent(data = {}) {
  const errors = [];
  const { title, intro, content, status } = data;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Title cannot be empty.');
    }
  }

  if (intro !== undefined) {
    if (typeof intro !== 'string' || intro.trim().length === 0) {
      errors.push('Intro summary cannot be empty.');
    }
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      errors.push('About Us editorial content cannot be empty.');
    }
  }

  if (status !== undefined) {
    if (!['draft', 'published'].includes(status)) {
      errors.push("Status must be either 'draft' or 'published'.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateAboutContent,
};
