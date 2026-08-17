import nodemailer from "nodemailer";

export function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

function resolveFromAddress() {
  const raw = String(process.env.SMTP_FROM || process.env.EMAIL_FROM || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();

  if (!raw) return user;
  if (raw.includes("@") && !raw.includes("<")) return raw;
  if (raw.includes("<") && raw.includes("@")) return raw;
  if (user) return `"${raw.replace(/"/g, "")}" <${user}>`;
  return raw;
}

function buildTransport() {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * @param {{ to: string; subject: string; text: string; html?: string }} opts
 */
export async function sendMail(opts) {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured");
  }

  const from = resolveFromAddress();

  const transport = buildTransport();
  await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
