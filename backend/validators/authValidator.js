/**
 * Input Validators for Authentication endpoints
 * TENZAL Luxury Resort - User Management Module | Student ID: 22CIS0274
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(data = {}) {
  const errors = [];
  const { name, email, password } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters).');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must include at least one uppercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must include at least one number.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateLogin(data = {}) {
  const errors = [];
  const { email, password } = data;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateChangePassword(data = {}) {
  const errors = [];
  const { currentPassword, newPassword, confirmPassword } = data;

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required.');
  }

  if (!newPassword || typeof newPassword !== 'string') {
    errors.push('New password is required.');
  } else {
    if (newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(newPassword)) {
      errors.push('New password must contain at least one uppercase letter.');
    }
    if (!/[0-9]/.test(newPassword)) {
      errors.push('New password must contain at least one numeric digit.');
    }
    if (currentPassword && currentPassword === newPassword) {
      errors.push('New password cannot be identical to your current password.');
    }
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    errors.push('Password confirmation does not match the new password.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
};
