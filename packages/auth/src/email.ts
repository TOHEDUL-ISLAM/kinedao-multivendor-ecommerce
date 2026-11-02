import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "@kineDao.com/env/server";

// Lazy-initialized transporter to avoid module load issues
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      throw new Error("SMTP credentials (SMTP_USER, SMTP_PASS) are not configured");
    }
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> {
  try {
    console.log("[EMAIL] Sending email to:", to);
    console.log("[EMAIL] Subject:", subject);

    const result = await getTransporter().sendMail({
      from: `"KineDao" <${env.EMAIL_FROM ?? env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("[EMAIL] Email sent successfully:", result.messageId);
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);
    throw error;
  }
}

