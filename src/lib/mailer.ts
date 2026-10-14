import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  const {
    GMAIL_USER,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;
  if (
    !GMAIL_USER ||
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !GOOGLE_REFRESH_TOKEN
  ) {
    throw new Error("Gmail OAuth2 environment variables are not configured.");
  }

  transporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GMAIL_USER,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
    },
  });

  return transporter;
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const sender = process.env.GMAIL_USER;
  if (!sender) {
    throw new Error("The GMAIL_USER environment variable is not configured.");
  }

  await getTransporter().sendMail({
    from: sender,
    to: email,
    subject: "Reset your SQI account password",
    text: `Use this link to reset your SQI account password. It expires in one hour:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Use the link below to reset your SQI account password. It expires in one hour.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

export function getApplicationUrl(): string {
  const configuredUrl = process.env.APP_URL;
  if (!configuredUrl) {
    throw new Error("The APP_URL environment variable is not configured.");
  }

  const url = new URL(configuredUrl);
  if (
    url.protocol !== "https:" &&
    !(process.env.NODE_ENV !== "production" && url.protocol === "http:")
  ) {
    throw new Error("APP_URL must use HTTPS in production.");
  }
  return url.origin;
}
