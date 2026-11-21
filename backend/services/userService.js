/**
 * User & Profile Management Service
 * TENZAL Luxury Resort - User Management Module | Student ID: 22CIS0274
 */

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sanitizeUser } = require('./authService');

/**
 * Get profile for authenticated user
 */
async function getUserProfile(userId) {
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
    const err = new Error('User profile not found.');
    err.status = 404;
    throw err;
  }

  return sanitizeUser(res.rows[0]);
}

/**
 * Update authenticated user's profile
 */
async function updateUserProfile(userId, { name, phone, country, address, date_of_birth, avatar_url }) {
  // Update name in users table if provided
  if (name !== undefined && name.trim() !== '') {
    await db.query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [name.trim(), userId]
    );
  }

  // Check if profile row exists
  const checkProfile = await db.query(
    'SELECT id FROM user_profiles WHERE user_id = $1',
    [userId]
  );

  if (!checkProfile.rows || checkProfile.rows.length === 0) {
    await db.query(
      `INSERT INTO user_profiles (user_id, phone, country, address, avatar_url, date_of_birth, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [userId, phone || null, country || 'Sri Lanka', address || null, avatar_url || null, date_of_birth || null]
    );
  } else {
    // Build update query dynamically
    const updates = [];
    const params = [];
    let idx = 1;

    if (phone !== undefined) {
      updates.push(`phone = $${idx++}`);
      params.push(phone);
    }
    if (country !== undefined) {
      updates.push(`country = $${idx++}`);
      params.push(country);
    }
    if (address !== undefined) {
      updates.push(`address = $${idx++}`);
      params.push(address);
    }
    if (date_of_birth !== undefined) {
      updates.push(`date_of_birth = $${idx++}`);
      params.push(date_of_birth);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      params.push(avatar_url);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(userId);
      await db.query(
        `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = $${idx}`,
        params
      );
    }
  }

  return getUserProfile(userId);
}

/**
 * Admin: Get all users with search, role, and status filters
 */
async function getAllUsers({ search, role, status } = {}) {
  let query = `
    SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.last_login_at, u.created_at, u.updated_at,
           r.name AS role, r.name AS role_name,
           p.phone, p.country, p.address, p.avatar_url, p.date_of_birth
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE 1=1
  `;
  const params = [];
  let paramIdx = 1;

  if (role) {
    query += ` AND LOWER(r.name) = LOWER($${paramIdx++})`;
    params.push(role);
  }

  if (status !== undefined && status !== null && status !== '') {
    const isActive = status === 'active' || status === true || status === 'true';
    query += ` AND u.is_active = $${paramIdx++}`;
    params.push(isActive);
  }

  if (search && search.trim() !== '') {
    query += ` AND (LOWER(u.name) LIKE $${paramIdx} OR LOWER(u.email) LIKE $${paramIdx} OR LOWER(COALESCE(p.phone, '')) LIKE $${paramIdx})`;
    params.push(`%${search.trim().toLowerCase()}%`);
    paramIdx++;
  }

  query += ` ORDER BY u.created_at DESC`;

  const res = await db.query(query, params);
  return (res.rows || []).map((u) => sanitizeUser(u));
}

/**
 * Admin: Get single user by ID
 */
async function getUserById(id) {
  const res = await db.query(
    `SELECT u.id, u.name, u.email, u.role_id, u.is_active, u.last_login_at, u.created_at, u.updated_at,
            r.name AS role, r.name AS role_name,
            p.phone, p.country, p.address, p.avatar_url, p.date_of_birth
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN user_profiles p ON u.id = p.user_id
     WHERE u.id = $1`,
    [id]
  );

  if (!res.rows || res.rows.length === 0) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  return sanitizeUser(res.rows[0]);
}

/**
 * Admin: Create a new staff or user account directly
 */
async function createUser({ name, email, password, role = 'staff', phone, country, address }) {
  const cleanEmail = email.trim().toLowerCase();

  const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
  if (existing.rows && existing.rows.length > 0) {
    const err = new Error('An account with this email address already exists.');
    err.status = 409;
    throw err;
  }

  const roleRes = await db.query('SELECT id, name FROM roles WHERE LOWER(name) = LOWER($1)', [role]);
  if (!roleRes.rows || roleRes.rows.length === 0) {
    const err = new Error(`Invalid role '${role}'.`);
    err.status = 400;
    throw err;
  }

  const roleId = roleRes.rows[0].id;
  const roleName = roleRes.rows[0].name;

  const passwordHash = await bcrypt.hash(password || 'Password123!', 10);

  const userRes = await db.query(
    `INSERT INTO users (name, email, password_hash, role_id, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, name, email, role_id, is_active, created_at`,
    [name.trim(), cleanEmail, passwordHash, roleId]
  );

  const newUser = userRes.rows[0];

  await db.query(
    `INSERT INTO user_profiles (user_id, phone, country, address, created_at, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [newUser.id, phone || null, country || 'Sri Lanka', address || null]
  );

  return sanitizeUser({ ...newUser, role: roleName }, { phone, country, address });
}

/**
 * Admin: Update user details
 */
async function updateUser(id, { name, email, role, phone, country, address, is_active }) {
  const user = await getUserById(id);

  if (name !== undefined) {
    await db.query('UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [name.trim(), id]);
  }

  if (email !== undefined && email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const duplicate = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim().toLowerCase(), id]);
    if (duplicate.rows && duplicate.rows.length > 0) {
      const err = new Error('This email address is already in use by another account.');
      err.status = 409;
      throw err;
    }
    await db.query('UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [email.trim().toLowerCase(), id]);
  }

  if (role !== undefined) {
    const roleRes = await db.query('SELECT id FROM roles WHERE LOWER(name) = LOWER($1)', [role.trim()]);
    if (roleRes.rows && roleRes.rows.length > 0) {
      await db.query('UPDATE users SET role_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [roleRes.rows[0].id, id]);
    }
  }

  if (is_active !== undefined) {
    await db.query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [is_active, id]);
  }

  // Update profile fields
  await updateUserProfile(id, { phone, country, address });

  return getUserById(id);
}

/**
 * Admin: Update user role
 */
async function updateUserRole(id, roleName) {
  const targetUser = await getUserById(id);
  const cleanRole = roleName.trim().toLowerCase();

  const roleRes = await db.query('SELECT id, name FROM roles WHERE LOWER(name) = LOWER($1)', [cleanRole]);
  if (!roleRes.rows || roleRes.rows.length === 0) {
    const err = new Error(`Role '${roleName}' does not exist.`);
    err.status = 400;
    throw err;
  }

  const newRoleId = roleRes.rows[0].id;

  // Prevent demoting last active admin
  if (targetUser.role === 'admin' && cleanRole !== 'admin') {
    const adminCountRes = await db.query(
      `SELECT COUNT(*) AS count FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name = 'admin' AND u.is_active = TRUE`
    );
    const count = parseInt(adminCountRes.rows[0]?.count || '1', 10);
    if (count <= 1) {
      const err = new Error('Cannot change role. The resort must have at least one active Administrator.');
      err.status = 400;
      throw err;
    }
  }

  await db.query('UPDATE users SET role_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newRoleId, id]);
  return getUserById(id);
}

/**
 * Admin: Update user status (activate / deactivate)
 */
async function updateUserStatus(id, isActive, currentAdminId) {
  if (id === currentAdminId && !isActive) {
    const err = new Error('Administrators cannot deactivate their own account.');
    err.status = 400;
    throw err;
  }

  await db.query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [isActive, id]);
  return getUserById(id);
}

/**
 * Admin: Delete user
 */
async function deleteUser(id, currentAdminId) {
  if (id === currentAdminId) {
    const err = new Error('Administrators cannot delete their own account.');
    err.status = 400;
    throw err;
  }

  const user = await getUserById(id);
  await db.query('DELETE FROM users WHERE id = $1', [id]);
  return { success: true, message: `User account for ${user.name} removed successfully.` };
}

/**
 * Get all available roles
 */
async function getRoles() {
  const res = await db.query('SELECT id, name, description, created_at FROM roles ORDER BY id ASC');
  return res.rows || [];
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getRoles,
};
