const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// GET /api/users  — admin only
router.get('/', authenticate, authorize('admin'), userController.getAllUsers);

// GET /api/users/:id/tasks  — admin (any user) | employee (own tasks only)
router.get('/:id/tasks', authenticate, userController.getUserTasks);

module.exports = router;
