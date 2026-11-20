/**
 * Input Validators for User & Profile Management
 * TENZAL Luxury Resort - User Management Module | Student ID: 22CIS0274
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s+\-().]{6,25}$/;

function validateUpdateProfile(data = {}) {
  const errors = [];
  const { name, phone, country, address, date_of_birth, avatar_url } = data;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long.');
    }
  }

  if (phone !== undefined && phone !== null && phone.trim() !== '') {
    if (!PHONE_REGEX.test(phone.trim())) {
      errors.push('Phone number contains invalid characters.');
    }
  }

  if (country !== undefined && country !== null) {
    if (typeof country !== 'string' || country.length > 100) {
      errors.push('Country name must be a string under 100 characters.');
    }
  }

  if (date_of_birth !== undefined && date_of_birth !== null && date_of_birth.trim() !== '') {
    const dob = new Date(date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.push('Date of birth must be a valid date (YYYY-MM-DD).');
    } else if (dob > new Date()) {
      errors.push('Date of birth cannot be in the future.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateCreateUser(data = {}) {
  const errors = [];
  const { name, email, password, role } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters).');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  const validRoles = ['admin', 'staff', 'guest'];
  if (role && !validRoles.includes(role.toLowerCase())) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateRoleUpdate(data = {}) {
  const errors = [];
  const { role } = data;
  const validRoles = ['admin', 'staff', 'guest'];

  if (!role || typeof role !== 'string' || !validRoles.includes(role.toLowerCase())) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateStatusUpdate(data = {}) {
  const errors = [];
  const { is_active } = data;

  if (typeof is_active !== 'boolean') {
    errors.push('is_active must be a boolean value (true or false).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateUpdateProfile,
  validateCreateUser,
  validateRoleUpdate,
  validateStatusUpdate,
};
