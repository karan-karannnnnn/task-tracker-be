const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { createTaskValidator, updateTaskValidator } = require('../validators/taskValidator');

// POST /api/tasks  — admin only
router.post('/', authenticate, authorize('admin'), createTaskValidator, taskController.createTask);

// GET /api/tasks  — admin sees all; employee sees own
router.get('/', authenticate, taskController.getAllTasks);

// GET /api/tasks/:id  — admin or owning employee
router.get('/:id', authenticate, taskController.getTaskById);

// PUT /api/tasks/:id  — admin (all fields) | employee (status only)
router.put('/:id', authenticate, updateTaskValidator, taskController.updateTask);

module.exports = router;
