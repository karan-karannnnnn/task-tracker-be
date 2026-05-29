/**
 * Centralized error handling middleware.
 * Must be registered last in the Express middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  // Prisma: unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'A record with this value already exists.',
      field: err.meta?.target,
    });
  }

  // Prisma: record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found.' });
  }

  // Prisma: foreign key constraint failed
  if (err.code === 'P2003') {
    return res.status(400).json({ message: 'Referenced record does not exist.' });
  }

  const statusCode = err.statusCode || 500;
  const message =
    statusCode < 500 ? err.message : 'An unexpected error occurred. Please try again later.';

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
