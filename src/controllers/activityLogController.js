const activityLogService = require('../services/activityLogService');

/**
 * GET /activity-logs
 * Admin only — returns paginated activity logs.
 * Supports filters: ?userId=1&taskId=2&page=1&limit=20
 */
const getLogs = async (req, res, next) => {
  try {
    const { userId, taskId, page, limit } = req.query;
    const result = await activityLogService.getLogs({ userId, taskId, page, limit });
    res.json({ data: result.data, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

module.exports = { getLogs };
