const prisma = require('../config/prisma');

/**
 * Create an activity log entry.
 */
const createLog = async ({ userId, taskId = null, action, details = null }) => {
  return prisma.activityLog.create({
    data: { userId, taskId, action, details },
  });
};

/**
 * Return a paginated list of activity logs.
 * Can be filtered by userId or taskId.
 */
const getLogs = async ({ userId, taskId, page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};
  if (userId) where.userId = Number(userId);
  if (taskId) where.taskId = Number(taskId);

  const [logs, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      skip,
      take,
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

module.exports = { createLog, getLogs };
