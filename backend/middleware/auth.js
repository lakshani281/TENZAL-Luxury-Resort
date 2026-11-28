/**
 * Authentication and Authorization Middleware
 * TENZAL Luxury Resort - User Management & Security Module
 * Student ID: 22CIS0274
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'tenzal_luxury_resort_super_secret_jwt_key_2026_secure';

/**
 * Authenticate incoming requests via Bearer JWT token.
 * Attaches decoded user object and database profile info to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No Bearer token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token format.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or malformed authentication token.',
        code: 'TOKEN_INVALID',
      });
    }

    // Verify user exists and account is active
    const userResult = await db.query(
      `SELECT u.id, u.name, u.email, u.role_id, u.is_active, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact the resort administrator.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Attach sanitized user information
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      role_id: user.role_id,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorize requests based on required role(s).
 * Usage: router.use(authenticate, authorize('admin', 'staff'))
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication must precede authorization.',
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Access denied for role '${req.user.role}'. Required: ${allowedRoles.join(' or ')}.`,
      });
    }

    next();
  };
}

/**
 * Lightweight in-memory rate limiter to protect auth endpoints against brute force attacks.
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 10, message = 'Too many requests' } = {}) {
  const requests = new Map();

  // Periodically clean expired entries; unref() prevents the timer from blocking process exit
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now - data.startTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, windowMs);
  if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = requests.get(ip) || { count: 0, startTime: now };

    if (now - entry.startTime > windowMs) {
      entry.count = 1;
      entry.startTime = now;
    } else {
      entry.count += 1;
    }

    requests.set(ip, entry);

    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: `${message}. Please try again later.`,
        retryAfterMs: windowMs - (now - entry.startTime),
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  createRateLimiter,
  JWT_SECRET,
};
