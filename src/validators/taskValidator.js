const { body, query } = require('express-validator');

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),

  body('description')
    .optional()
    .trim(),

  body('assigned_to')
    .notEmpty()
    .withMessage('assigned_to is required')
    .isInt({ gt: 0 })
    .withMessage('assigned_to must be a valid positive integer user ID'),

  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('status must be one of: pending, in_progress, completed'),

  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('due_date must be a valid ISO 8601 date (e.g. 2025-12-31)'),
];

const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),

  body('description')
    .optional()
    .trim(),

  body('assigned_to')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('assigned_to must be a valid positive integer user ID'),

  body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed'])
    .withMessage('status must be one of: pending, in_progress, completed'),

  body('due_date')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('due_date must be a valid ISO 8601 date (e.g. 2025-12-31)'),
];

module.exports = { createTaskValidator, updateTaskValidator };
