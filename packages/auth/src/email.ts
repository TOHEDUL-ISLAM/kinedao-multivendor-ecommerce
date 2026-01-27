import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "@kineDao.com/env/server";

// Lazy-initialized transporter to avoid module load issues
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
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
      from: `"KineDao" <${env.EMAIL_USER}>`,
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
