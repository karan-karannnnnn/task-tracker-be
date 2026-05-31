const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const activityLogService = require('../services/activityLogService');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const user = await authService.register(req.body);

    await activityLogService.createLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      details: `New user registered: ${user.email} (${user.role})`,
    });

    res.status(201).json({
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const result = await authService.login(req.body);

    await activityLogService.createLog({
      userId: result.user.id,
      action: 'USER_LOGIN',
      details: `User logged in: ${result.user.email}`,
    });

    res.json({
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  res.json({ data: req.user });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    // Always respond with a generic message to avoid revealing account existence
    res.json({ message: 'Password reset email was sent' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword({ token, password });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, forgotPassword, resetPassword };
