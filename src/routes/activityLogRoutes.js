const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// GET /api/activity-logs  — admin only
router.get('/', authenticate, authorize('admin'), activityLogController.getLogs);

module.exports = router;
