import express from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import { authRateLimiter, registrationRateLimiter } from '../middleware/rateLimit.js';
import { authenticate } from '../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
);

const validateRegistration = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone number is required').isLength({ min: 10, max: 10 }).withMessage('Phone must be exactly 10 digits'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }
    next();
  }
];

// Local auth
router.post('/register',      registrationRateLimiter, validateRegistration, authController.register);
router.post('/login',         authRateLimiter, authController.login);
router.post('/logout',        authenticate,    authController.logout);
router.post('/refresh',                        authController.refresh);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password',  authRateLimiter, authController.resetPassword);

if (googleConfigured) {
  router.get('/google', (req, res, next) => {
    const redirect = req.query.redirect || '/';
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: typeof redirect === 'string' ? redirect : '/',
    })(req, res, next);
  });
  router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
    authController.googleCallback
  );
} else {
  router.get('/google', (req, res) => {
    res.status(503).json({ success: false, message: 'Google OAuth is not configured' });
  });
  router.get('/google/callback', (req, res) => {
    res.status(503).json({ success: false, message: 'Google OAuth is not configured' });
  });
}

// Get current user
router.get('/me', authenticate, authController.getMe);

export default router;
