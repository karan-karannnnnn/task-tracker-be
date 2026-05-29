const prisma = require('../config/prisma');

/**
 * Return a paginated list of all users.
 */
const getAllUsers = async ({ page = 1, limit = 10 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return {
    data: users,
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Return tasks assigned to a specific user.
 * Supports filters: status, dueDate (tasks due on or before this date).
 * Uses a SQL JOIN via Prisma's include (generates INNER JOIN in SQL).
 */
const getUserTasks = async (userId, { status, dueDate, page = 1, limit = 10 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = { assignedTo: Number(userId) };
  if (status) where.status = status;
  if (dueDate) where.dueDate = { lte: new Date(dueDate) };

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      skip,
      take,
      include: {
        // Prisma translates this relation include into a SQL JOIN on tasks.assigned_to = users.id
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: tasks,
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

module.exports = { getAllUsers, getUserTasks };
