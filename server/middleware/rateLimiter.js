const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// AI-specific rate limiter: 20 requests per hour, keyed by user ID or IP
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.user?.userId || req.ip;
  },
  message: { error: 'AI rate limit exceeded. Maximum 20 AI requests per hour.' },
});

module.exports = { apiRateLimiter, aiRateLimiter };
