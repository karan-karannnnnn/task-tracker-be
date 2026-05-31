const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const crypto = require('crypto');
const sendResetEmail = require('../utils/email');
const activityLogService = require('./activityLogService');

/**
 * Register a new user.
 */
const register = async ({ name, email, password, role }) => {
  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser) {
    const error = new Error('Email is already in use');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'employee',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * Login and return a signed JWT token.
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

/**
 * Create a password reset token and send reset instructions.
 */
const forgotPassword = async (email) => {
  const user = await prisma.user.findFirst({ where: { email } });
  
  console.log(`Password reset requested for email: ${email}`);
  console.log(`user found: ${user}`);

  if (!user) return; // intentionally silent to avoid user enumeration

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expires },
  });

  await sendResetEmail(user.email, token);
};

/**
 * Validate token and reset the user's password.
 */
const resetPassword = async ({ token, password }) => {
  const reset = await prisma.passwordReset.findFirst({ where: { token } });

  if (!reset || reset.expires < new Date()) {
    const error = new Error('Invalid or expired token');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findFirst({ where: { id: reset.userId } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const serverHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: serverHash, updatedAt: new Date() } });

  await prisma.passwordReset.delete({ where: { id: reset.id } });

  await activityLogService.createLog({ userId: user.id, action: 'PASSWORD_RESET', details: 'Password reset via token' });
};

module.exports = { register, login, forgotPassword, resetPassword };
