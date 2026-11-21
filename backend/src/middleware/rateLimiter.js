/**
 * =============================================================================
 * TENZAL Luxury Resort - Food Ordering Module (Student ID: 22CIS0328)
 * Middleware: In-Memory IP Rate Limiter
 * File: backend/src/middleware/rateLimiter.js
 * =============================================================================
 * Lightweight, zero-dependency sliding-window/token rate limiter designed
 * specifically to protect the public Order Code Tracking endpoint from
 * automated brute-force enumeration and denial-of-service hammering.
 *
 * ARCHITECTURAL NOTICE:
 * This rate limiter operates strictly in-memory per Node.js process. In a
 * multi-instance, clustered, or serverless deployment, rate limiting state
 * is not shared across processes. A distributed store (e.g. Redis) should
 * be integrated when horizontal scaling is configured.
 *
 * PRIVACY & SECURITY NOTICE:
 * - Does not log sensitive guest information, room numbers, or order notes.
 * - Extracts client IP using req.ip (honors 'trust proxy' only if configured)
 *   and falls back to req.socket.remoteAddress to prevent header spoofing.
 * - Enforces periodic cleanup to guarantee bounded memory usage.
 * =============================================================================
 */

/**
 * Creates an in-memory rate limiter middleware instance.
 *
 * @param {Object} options
 * @param {number} [options.windowMs=60000] - Window duration in milliseconds (default: 1 minute)
 * @param {number} [options.max=30] - Maximum requests allowed per window per IP (default: 30)
 * @param {string} [options.message] - Custom error message for HTTP 429 response
 * @returns {Function} Express middleware function
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute window
  const maxRequests = options.max || 30; // 30 requests max
  const errorMessage =
    options.message || 'Too many order tracking requests from this IP. Please try again after 60 seconds.';

  // Map<ipString, { count: number, resetTime: number }>
  const ipStore = new Map();

  // Maximum number of distinct IPs allowed in memory simultaneously as a safety cap
  const MAX_STORE_SIZE = 10000;

  /**
   * Cleans up expired entries to prevent memory leaks over long uptime.
   */
  function cleanupExpired() {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      if (record.resetTime <= now) {
        ipStore.delete(ip);
      }
    }
  }

  // Periodic cleanup every 60 seconds; unref() prevents the timer from blocking process exit
  const cleanupTimer = setInterval(cleanupExpired, 60 * 1000);
  if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  /**
   * Safely extracts client IP address without trusting unvalidated proxy headers.
   *
   * @param {Object} req - Express request object
   * @returns {string}
   */
  function getClientIp(req) {
    // req.ip respects Express 'trust proxy' setting if configured on app.
    // Falls back to direct TCP socket address to prevent caller spoofing.
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }

  return function rateLimiterMiddleware(req, res, next) {
    const clientIp = getClientIp(req);
    const now = Date.now();

    // Enforce memory safety cap if store exceeds capacity
    if (ipStore.size >= MAX_STORE_SIZE) {
      cleanupExpired();
      // If still full, drop the oldest record
      if (ipStore.size >= MAX_STORE_SIZE) {
        const oldestKey = ipStore.keys().next().value;
        if (oldestKey) {
          ipStore.delete(oldestKey);
        }
      }
    }

    let record = ipStore.get(clientIp);

    if (!record || record.resetTime <= now) {
      // New window for this IP
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      ipStore.set(clientIp, record);
      return next();
    }

    // Existing active window
    record.count += 1;

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

      const defaultMsg = `Too many requests from this IP. Please try again after ${retryAfterSeconds} seconds.`;
      const customMsg =
        typeof options.message === 'function'
          ? options.message(retryAfterSeconds)
          : (options.message || defaultMsg);

      return res.status(429).json({
        status: 'error',
        success: false,
        message: customMsg,
      });
    }

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

    return next();
  };
}

// Pre-configured rate limiter instance for public order tracking: 30 requests per minute
const orderTrackingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: (sec) => `Too many order tracking requests from this IP. Please try again after ${sec} seconds.`,
});

// Pre-configured rate limiter instance for order placement: 10 requests per minute
const orderCreationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: (sec) => `Too many order placement requests from this IP. Please try again after ${sec} seconds.`,
});

module.exports = {
  createRateLimiter,
  orderTrackingRateLimiter,
  orderCreationRateLimiter,
};
