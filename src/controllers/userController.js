const userService = require('../services/userService');

/**
 * GET /users
 * Admin only — returns paginated list of all users.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await userService.getAllUsers({ page, limit });
    res.json({ data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /users/:id/tasks
 * Admin can view any user's tasks.
 * Employees can only view their own tasks.
 * Supports filters: ?status=pending&dueDate=2025-07-01&page=1&limit=10
 */
const getUserTasks = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'employee' && req.user.id !== Number(id)) {
      return res.status(403).json({ message: 'Access denied. You can only view your own tasks.' });
    }

    const { status, dueDate, page, limit } = req.query;
    const result = await userService.getUserTasks(id, { status, dueDate, page, limit });
    res.json({ data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserTasks };
