const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { registerValidator, loginValidator } = require('../validators/authValidator');

// POST /api/auth/register
router.post('/register', registerValidator, authController.register);

// POST /api/auth/login
router.post('/login', loginValidator, authController.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

// GET /api/auth/profile  (requires authentication)
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
