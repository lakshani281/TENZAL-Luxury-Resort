/**
 * Authentication Service
 * TENZAL Luxury Resort - User Management & Security Module
 * Student ID: 22CIS0274
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate signed JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Remove sensitive credentials from user object
 */
function sanitizeUser(user, profile = {}) {
  const { password_hash, ...safeUser } = user;
  return {
    ...safeUser,
    phone: profile.phone || user.phone || '',
    country: profile.country || user.country || 'Sri Lanka',
    address: profile.address || user.address || '',
    avatar_url: profile.avatar_url || user.avatar_url || null,
    date_of_birth: profile.date_of_birth || user.date_of_birth || null,
  };
}

/**
 * Register a new user account (defaults to guest role)
 */
async function register({ name, email, password, phone, country, address }) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if email already registered
  const existingRes = await db.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [cleanEmail]
  );

  if (existingRes.rows && existingRes.rows.length > 0) {
    const err = new Error('An account with this email address already exists.');
    err.status = 409;
    throw err;
  }

  // 2. Hash password with bcrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 3. Resolve role (default: 'guest' = 3)
  const roleRes = await db.query(
    'SELECT id, name FROM roles WHERE LOWER(name) = LOWER($1)',
    ['guest']
  );
  const roleId = roleRes.rows && roleRes.rows.length > 0 ? roleRes.rows[0].id : 3;
  const roleName = roleRes.rows && roleRes.rows.length > 0 ? roleRes.rows[0].name : 'guest';

  // 4. Insert user
  const userRes = await db.query(
    `INSERT INTO users (name, email, password_hash, role_id, is_active, last_login_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, name, email, role_id, is_active, created_at`,
    [name.trim(), cleanEmail, passwordHash, roleId]
  );

  const newUser = userRes.rows[0];

  // 5. Create associated user_profile
  await db.query(
    `INSERT INTO user_profiles (user_id, phone, country, address, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [newUser.id, phone || null, country || 'Sri Lanka', address || null]
  );

  // 6. Generate token
  const token = generateToken({
    id: newUser.id,
    email: newUser.email,
    role: roleName,
    role_id: roleId,
  });

  return {
    user: sanitizeUser({ ...newUser, role: roleName }, { phone, country, address }),
    token,
  };
}

/**
 * Login user with email and password
 */
async function login({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();

  // Query user with joined role
  const res = await db.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role_id, u.is_active, r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE LOWER(u.email) = LOWER($1)`,
    [cleanEmail]
  );

  // Use generic message to prevent account enumeration
  if (!res.rows || res.rows.length === 0) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  const user = res.rows[0];

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    throw err;
  }

  // Check account status
  if (!user.is_active) {
    const err = new Error('Your account has been deactivated. Please contact resort management.');
    err.status = 403;
    err.code = 'ACCOUNT_DEACTIVATED';
    throw err;
  }

  // Update last login timestamp
  try {
    await db.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
  } catch (e) {
    // Non-fatal if timestamp update fails
  }

  // Fetch profile
  const profileRes = await db.query(
    'SELECT phone, country, address, avatar_url, date_of_birth FROM user_profiles WHERE user_id = $1',
    [user.id]
  );
  const profile = profileRes.rows && profileRes.rows[0] ? profileRes.rows[0] : {};

  // Sign token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    role_id: user.role_id,
  });

  return {
    user: sanitizeUser(user, profile),
    token,
  };
}

/**
 * Get currently authenticated user details
 */
async function getMe(userId) {
  const res = await db.query(
    `SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.last_login_at, u.created_at,
            r.name AS role, r.description AS role_description,
            p.phone, p.country, p.address, p.avatar_url, p.date_of_birth
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [userId]
  );

  if (!res.rows || res.rows.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  return sanitizeUser(res.rows[0]);
}

/**
 * Change user password
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const res = await db.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (!res.rows || res.rows.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const user = res.rows[0];

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.status = 400;
    throw err;
  }

  // Hash new password
  const newHash = await bcrypt.hash(newPassword, 10);

  // Update password in DB
  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newHash, userId]
  );

  return { success: true, message: 'Password updated successfully.' };
}

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  sanitizeUser,
  generateToken,
};
