import nodemailer from 'nodemailer';

// Create transporter using Gmail SMTP or custom SMTP
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { messageId: info.messageId };
  } catch (err) {
    console.error('Email Send Error:', err.message);
    throw err;
  }
};
