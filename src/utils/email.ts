import { Resend } from "resend";
import AppError from "./appError.js";

const getClient = (): Resend => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "Email service is not configured. RESEND_API_KEY is missing.",
      500
    );
  }
  return new Resend(apiKey);
};

const getFromAddress = (): string =>
  process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const resolveRecipient = (intendedTo: string): string =>
  process.env.RESEND_TO_EMAIL || intendedTo;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<void> => {
  const client = getClient();

  const { error } = await client.emails.send({
    from: getFromAddress(),
    to: resolveRecipient(to),
    subject,
    html,
    text,
  });

  if (error) {
    throw new AppError(
      `Failed to send email: ${error.message || "unknown error"}`,
      500
    );
  }
};

const buildResetEmailHtml = (name: string, resetUrl: string): string => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:24px;background:#0b0b12;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e6e6f0;">
    <div style="max-width:560px;margin:0 auto;background:#15151f;border:1px solid #2a2a3a;border-radius:14px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;color:#fff;">Reset your password</h1>
      <p style="margin:0 0 20px;line-height:1.6;">Hi ${name || "there"},</p>
      <p style="margin:0 0 20px;line-height:1.6;">
        We received a request to reset the password on your EduCourse account.
        Click the button below to choose a new password. This link is valid for
        <strong>10 minutes</strong>.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}"
           style="display:inline-block;padding:14px 28px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;border-radius:10px;">
          Reset password
        </a>
      </p>
      <p style="margin:0 0 12px;line-height:1.6;font-size:13px;color:#a0a0b8;">
        If the button doesn't work, copy and paste this URL into your browser:
      </p>
      <p style="margin:0 0 20px;line-height:1.5;font-size:13px;color:#9ca3af;word-break:break-all;">${resetUrl}</p>
      <hr style="border:none;border-top:1px solid #2a2a3a;margin:24px 0;" />
      <p style="margin:0;font-size:12px;color:#7a7a90;line-height:1.5;">
        If you did not request a password reset, you can safely ignore this email — your
        password will not change.
      </p>
    </div>
  </body>
</html>
`;

const buildResetEmailText = (name: string, resetUrl: string): string =>
  `Hi ${name || "there"},\n\n` +
  `We received a request to reset the password on your EduCourse account.\n` +
  `Use the link below to choose a new password. This link is valid for 10 minutes.\n\n` +
  `${resetUrl}\n\n` +
  `If you did not request a password reset, you can ignore this email.\n`;

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetUrl: string
): Promise<void> => {
  await sendEmail({
    to,
    subject: "Reset your EduCourse password",
    html: buildResetEmailHtml(name, resetUrl),
    text: buildResetEmailText(name, resetUrl),
  });
};
