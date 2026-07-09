import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config';
import logger from '../utils/logger';

export type EmailJobPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;
    if (!config.email.smtpHost) return null;

    this.transporter = nodemailer.createTransport({
      host: config.email.smtpHost,
      port: config.email.smtpPort,
      secure: config.email.smtpSecure,
      auth: config.email.smtpUser
        ? { user: config.email.smtpUser, pass: config.email.smtpPass }
        : undefined,
    });
    return this.transporter;
  }

  async send(payload: EmailJobPayload): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      logger.info(`[email:dev] To: ${payload.to} | Subject: ${payload.subject}`);
      logger.debug(`[email:dev] Body: ${payload.text ?? payload.html}`);
      return;
    }

    await transporter.sendMail({
      from: config.email.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
  }

  buildVerificationEmail(email: string, token: string) {
    const link = `${config.frontendUrl}/customer/auth/verify?token=${token}`;
    return {
      to: email,
      subject: 'Verify your PredixRoute account',
      html: `<p>Welcome to PredixRoute.</p><p><a href="${link}">Verify your email</a></p><p>Or use token: <code>${token}</code></p>`,
      text: `Verify your PredixRoute account: ${link}`,
    };
  }

  buildPasswordResetEmail(email: string, token: string) {
    const link = `${config.frontendUrl}/customer/auth/reset-password?token=${token}`;
    return {
      to: email,
      subject: 'Reset your PredixRoute password',
      html: `<p>Reset your password:</p><p><a href="${link}">Reset password</a></p><p>Link expires in 1 hour.</p>`,
      text: `Reset your PredixRoute password: ${link}`,
    };
  }
}

export const emailService = new EmailService();
