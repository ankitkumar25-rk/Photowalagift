const fs = require('fs');
const f = 'src/controllers/auth.controller.js';
let c = fs.readFileSync(f, 'utf8');
const searchString = 'export const verifyEmail =';
c = c.substring(0, c.indexOf(searchString));

c += `
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = z.object({
    email: z.string().email(),
    otp: z.string().length(6).regex(/^\\d+$/),
  }).parse(req.body);

  const normalizedEmail = email.toLowerCase();
  const redisKey = \\\`otp:\${normalizedEmail}\\\`;
  const storedOtp = await valkey.get(redisKey);

  if (!storedOtp || storedOtp !== otp) {
    throw createError('Invalid or expired OTP', 400);
  }

  const user = await prisma.user.findFirst({ where: { email: normalizedEmail } });
  if (!user) throw createError('User not found', 404);

  await prisma.user.update({
    where: { id: user.id },
    data: { isVerified: true },
  });

  await valkey.del(redisKey);

  const { accessToken, refreshToken } = await issueTokens(user);

  res.cookie('access_token', accessToken, COOKIE_OPTS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTS);

  res.json({
    success: true,
    message: 'Account verified successfully!',
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    },
  });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findFirst({ where: { email: normalizedEmail } });
  if (!user) throw createError('User not found', 404);
  if (user.isVerified) throw createError('Email is already verified', 400);

  // Rate limiting check
  const rateLimitKey = \\\`otp_rate:\${normalizedEmail}\\\`;
  const canSend = await valkey.set(rateLimitKey, '1', 'EX', 60, 'NX');
  if (!canSend) {
    throw createError('Please wait at least 60 seconds before requesting a new OTP', 429);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const redisKey = \\\`otp:\${normalizedEmail}\\\`;
  await valkey.setex(redisKey, 600, otp);

  await emailService.sendOtpEmail({ to: normalizedEmail, userName: user.name, otp }).catch(console.error);

  res.json({
    success: true,
    message: 'OTP sent to your email.'
  });
});
`;

fs.writeFileSync(f, c);
