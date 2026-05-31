const prisma = require('../config/prisma');

/**
 * Create a new task and assign it to a user.
 */
const createTask = async ({ title, description, assigned_to, status, due_date }) => {
  const user = await prisma.user.findFirst({ where: { id: Number(assigned_to) } });
  if (!user) {
    const error = new Error('Assigned user not found');
    error.statusCode = 404;
    throw error;
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      assignedTo: Number(assigned_to),
      status: status || 'pending',
      dueDate: due_date ? new Date(due_date) : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return task;
};

/**
 * Return a paginated, filterable list of all tasks.
 * Supports filters: status, dueDate, assignedTo.
 * Uses Prisma include which generates an INNER JOIN with users table.
 */
const getAllTasks = async ({ status, dueDate, assignedTo, page = 1, limit = 10 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};
  if (status) where.status = status;
  if (dueDate) where.dueDate = { lte: new Date(dueDate) };
  if (assignedTo) where.assignedTo = Number(assignedTo);

  const [tasks, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      skip,
      take,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
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

/**
 * Get a single task by ID.
 * Uses a raw SQL JOIN query to explicitly fulfill the "at least one SQL JOIN" requirement.
 */
const getTaskById = async (id) => {
  // Explicit SQL JOIN: tasks JOIN users ON tasks.assigned_to = users.id
  const rows = await prisma.$queryRaw`
    SELECT
      t.id,
      t.title,
      t.description,
      t.assigned_to,
      t.status,
      t.due_date,
      t.created_at,
      t.updated_at,
      u.name  AS assigned_user_name,
      u.email AS assigned_user_email,
      u.role  AS assigned_user_role
    FROM tasks t
    JOIN users u ON t.assigned_to = u.id
    WHERE t.id = ${Number(id)}
  `;

  if (!rows || rows.length === 0) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  const row = rows[0];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignedTo: {
      id: row.assigned_to,
      name: row.assigned_user_name,
      email: row.assigned_user_email,
      role: row.assigned_user_role,
    },
  };
};

/**
 * Update an existing task's fields.
 * Returns both the updated task and the previous status (for activity log diffing).
 */
const updateTask = async (id, { title, description, status, due_date, assigned_to }) => {
  const existingTask = await prisma.task.findFirst({ where: { id: Number(id) } });
  if (!existingTask) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }

  if (assigned_to !== undefined) {
    const user = await prisma.user.findFirst({ where: { id: Number(assigned_to) } });
    if (!user) {
      const error = new Error('Assigned user not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (due_date !== undefined) updateData.dueDate = due_date ? new Date(due_date) : null;
  if (assigned_to !== undefined) updateData.assignedTo = Number(assigned_to);

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return { task, previousStatus: existingTask.status };
};

module.exports = { createTask, getAllTasks, getTaskById, updateTask };
