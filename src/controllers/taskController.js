const { validationResult } = require('express-validator');
const taskService = require('../services/taskService');
const activityLogService = require('../services/activityLogService');

/**
 * POST /tasks
 * Admin only — creates a new task.
 */
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const task = await taskService.createTask(req.body);

    await activityLogService.createLog({
      userId: req.user.id,
      taskId: task.id,
      action: 'TASK_CREATED',
      details: `Task "${task.title}" created and assigned to ${task.user.name}`,
    });

    res.status(201).json({
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /tasks
 * Admins see all tasks; employees see only their own.
 * Supports filters: ?status=pending&dueDate=2025-07-01&assignedTo=2&page=1&limit=10
 */
const getAllTasks = async (req, res, next) => {
  try {
    const { status, dueDate, assignedTo, page, limit } = req.query;

    const filters = { status, dueDate, page, limit };
    // Employees are restricted to their own tasks regardless of query params
    filters.assignedTo = req.user.role === 'employee' ? req.user.id : assignedTo;

    const result = await taskService.getAllTasks(filters);
    res.json({ data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /tasks/:id
 * Employees can only view tasks assigned to them.
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (req.user.role === 'employee' && task.assignedTo.id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. This task is not assigned to you.' });
    }

    res.json({ data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /tasks/:id
 * Admins can update all fields.
 * Employees can only update the status of tasks assigned to them.
 */
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    if (req.user.role === 'employee') {
      // Verify the task belongs to this employee
      const existingTask = await taskService.getTaskById(req.params.id);
      if (existingTask.assignedTo.id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. This task is not assigned to you.' });
      }

      if (!req.body.status) {
        return res.status(422).json({ message: 'Employees may only update the task status.' });
      }

      // Restrict employees to only the status field
      req.body = { status: req.body.status };
    }

    const { task, previousStatus } = await taskService.updateTask(req.params.id, req.body);

    // Build a human-readable change summary for the activity log
    const changes = [];
    if (req.body.status && req.body.status !== previousStatus) {
      changes.push(`Status: ${previousStatus} → ${req.body.status}`);
    }
    if (req.body.title) changes.push('Title updated');
    if (req.body.description !== undefined) changes.push('Description updated');
    if (req.body.due_date !== undefined) changes.push('Due date updated');
    if (req.body.assigned_to !== undefined) changes.push('Assignee updated');

    await activityLogService.createLog({
      userId: req.user.id,
      taskId: task.id,
      action: 'TASK_UPDATED',
      details: changes.length > 0 ? changes.join('; ') : 'Task updated',
    });

    res.json({
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getAllTasks, getTaskById, updateTask };
