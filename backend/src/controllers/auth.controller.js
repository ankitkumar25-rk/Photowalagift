import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../config/paseto.js';
import { sendMail } from '../lib/mailer.js';
import { emailTemplates } from '../config/email.js';
import { createError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import asyncHandler from '../utils/asyncHandler.js';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,         // MUST be true for sameSite: 'none'
  sameSite: 'none',     // MUST be 'none' for cross-origin (Vercel → VPS)
  maxAge: 15 * 60 * 1000,
  path: '/',
};

const REFRESH_COOKIE_OPTS = {
  ...COOKIE_OPTS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function issueTokens(user) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  try {
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    console.error('[auth] refresh token persistence failed:', err.message);
  }

  return { accessToken, refreshToken };
}

export const register = asyncHandler(async (req, res) => {
  let { name, email, password } = registerSchema.parse(req.body);
  email = email.trim().toLowerCase();
  name = name.trim();

  const exists = await prisma.user.findFirst({ where: { email } });
  if (exists) throw createError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Generate email verification token (valid for 24 hours)
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  
  await prisma.emailVerificationToken.create({
    data: {
      token: hashedToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Send verification email
  const verificationLink = `${process.env.CLIENT_URL}verify-email?token=${verificationToken}&email=${email}`;
  const tpl = emailTemplates.emailVerification(user, verificationLink);
  sendMail({ to: user.email, subject: tpl.subject, html: tpl.html }).catch(console.error);

  res.status(201).json({
    success: true,
    message: 'Account created! Please check your email to verify your account.',
    data: { 
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  let { email, password } = loginSchema.parse(req.body);
  email = email.trim().toLowerCase();

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user || !user.passwordHash) throw createError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError('Invalid credentials', 401);

  const { accessToken, refreshToken } = await issueTokens(user);

  res.cookie('access_token', accessToken, COOKIE_OPTS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTS);

  res.json({
    success: true,
    data: { 
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token || req.body.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req, res) => {
  const authHeader = req.headers?.authorization;
  let token = req.cookies?.refresh_token;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token) {
    token = req.body?.refreshToken;
  }
  if (!token) throw createError('Refresh token required', 401);

  let payload;
  try {
    payload = await verifyToken(token);
  } catch (err) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return res.status(401).json({ success: false, error: 'REFRESH_TOKEN_EXPIRED', message: 'Session expired' });
  }

  if (payload.purpose !== 'refresh') throw createError('Invalid token', 401);

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    return res.status(401).json({ success: false, error: 'REFRESH_TOKEN_EXPIRED', message: 'Session expired' });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw createError('User not found', 401);

  await prisma.refreshToken.delete({ where: { token } }).catch(() => {});
  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

  res.cookie('access_token', accessToken, COOKIE_OPTS);
  res.cookie('refresh_token', newRefreshToken, REFRESH_COOKIE_OPTS);

  res.json({ 
    success: true, 
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken: newRefreshToken
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true },
  });
  if (!user) throw createError('User not found', 404);
  res.json({ 
    success: true, 
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl } 
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });

  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });

  const resetToken = crypto.randomUUID();
  await prisma.passwordResetToken.create({
    data: {
      token: resetToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const tpl = emailTemplates.passwordReset(user, resetUrl);
  await sendMail({ to: user.email, subject: tpl.subject, html: tpl.html });

  res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = z.object({
    token: z.string().uuid(),
    password: z.string().min(8),
  }).parse(req.body);

  const resetRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
    throw createError('Reset link is invalid or has expired', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
    prisma.refreshToken.deleteMany({ where: { userId: resetRecord.userId } }),
  ]);

  res.json({ success: true, message: 'Password reset successfully. Please log in again.' });
});

export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  const { accessToken, refreshToken } = await issueTokens(user);
  
  res.cookie('access_token', accessToken, COOKIE_OPTS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTS);

  const encodedAccessToken = encodeURIComponent(accessToken);
  const encodedRefreshToken = encodeURIComponent(refreshToken);
  const clientUrl = String(process.env.CLIENT_URL || '').replace(/\/$/, '');
  
  const state = req.query.state || '/';
  const encodedState = encodeURIComponent(state);
  const redirectUrl = `${clientUrl}/auth/success?access_token=${encodedAccessToken}&refresh_token=${encodedRefreshToken}&success=true&redirect=${encodedState}`;
  
  res.redirect(redirectUrl);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token, email } = req.body;
  
  if (!token || !email) {
    throw createError('Token and email are required', 400);
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find and verify the token
  const verificationToken = await prisma.emailVerificationToken.findFirst({
    where: {
      token: hashedToken,
      user: { email: email.toLowerCase() },
      used: false,
      expiresAt: { gt: new Date() }, // Token not expired
    },
    include: { user: true },
  });

  if (!verificationToken) {
    throw createError('Invalid or expired verification token', 400);
  }

  // Update user as verified and mark token as used
  const user = await prisma.user.update({
    where: { id: verificationToken.userId },
    data: { isEmailVerified: true },
  });

  await prisma.emailVerificationToken.update({
    where: { id: verificationToken.id },
    data: { used: true },
  });

  // Issue tokens for auto login
  const { accessToken, refreshToken } = await issueTokens(user);

  res.cookie('access_token', accessToken, COOKIE_OPTS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTS);

  res.json({
    success: true,
    message: 'Email verified successfully! You are now logged in.',
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    },
  });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw createError('Email is required', 400);
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.isEmailVerified) {
    throw createError('Email is already verified', 400);
  }

  // Invalidate old tokens
  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
  
  await prisma.emailVerificationToken.create({
    data: {
      token: hashedToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  // Send verification email
  const verificationLink = `${process.env.CLIENT_URL}verify-email?token=${verificationToken}&email=${email}`;
  const tpl = emailTemplates.emailVerification(user, verificationLink);
  sendMail({ to: user.email, subject: tpl.subject, html: tpl.html }).catch(console.error);

  res.json({
    success: true,
    message: 'Verification email sent. Please check your inbox.',
  });
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendOTP = asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const normalizedEmail = email.toLowerCase();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw createError('Email already registered', 409);

  // Invalidate old OTPs for this email
  await prisma.emailOTP.updateMany({
    where: { email: normalizedEmail, used: false },
    data: { used: true },
  });

  // Generate and save new OTP (valid for 10 minutes)
  const otp = generateOTP();
  await prisma.emailOTP.create({
    data: {
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // Send OTP email
  const { emailService } = await import('../services/email.service.js');
  await emailService.sendOtpEmail({ to: normalizedEmail, userName: 'User', otp });

  res.json({
    success: true,
    message: `OTP sent to ${normalizedEmail}. Valid for 10 minutes.`,
  });
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp, name, password } = z.object({
    email: z.string().email(),
    otp: z.string().length(6).regex(/^\d+$/),
    name: z.string().min(2).max(100),
    password: z.string().min(8).max(128),
  }).parse(req.body);

  const normalizedEmail = email.toLowerCase();

  // Find valid OTP
  const otpRecord = await prisma.emailOTP.findFirst({
    where: {
      email: normalizedEmail,
      otp,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpRecord) throw createError('Invalid or expired OTP', 400);

  // Mark OTP as used
  await prisma.emailOTP.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  // Create user
  const exists = await prisma.user.findFirst({ where: { email: normalizedEmail } });
  if (exists) throw createError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      isEmailVerified: true, // Auto-verify since OTP was verified
    },
  });

  // Issue tokens
  const { accessToken, refreshToken } = await issueTokens(user);

  // Set cookies
  res.cookie('accessToken', accessToken, COOKIE_OPTS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);

  res.status(201).json({
    success: true,
    message: 'Account created and verified successfully!',
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});
