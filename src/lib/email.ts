import nodemailer from 'nodemailer';

const { GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_FROM } = process.env;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.warn('[EMAIL] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export const sendVerificationEmail = async (to: string, code: string, verifyLink: string) => {
  const from = EMAIL_FROM || GMAIL_USER || 'no-reply@example.com';

  await transporter.sendMail({
    from,
    to,
    subject: 'Verify your email',
    text: `Your verification code is ${code}. This code expires in 15 minutes.\n\nOr verify using this link: ${verifyLink}`,
    html: `
      <p>Your verification code is <strong>${code}</strong>. This code expires in 15 minutes.</p>
      <p>Or verify using this link: <a href="${verifyLink}">Verify Email</a></p>
    `,
  });
};
