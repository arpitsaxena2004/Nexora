import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  recipient: string;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = env.SMTP_HOST || process.env.SMTP_HOST;
    const port = env.SMTP_PORT || (process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587);
    const user = env.SMTP_USER || process.env.SMTP_USER;
    const pass = env.SMTP_PASS || process.env.SMTP_PASS;
    const secure = env.SMTP_SECURE ?? (process.env.SMTP_SECURE === 'true');

    if (user && pass) {
      // Remove spaces if passed in app password with spaces (e.g. 'xxxx yyyy zzzz wwww')
      const sanitizedPass = pass.replace(/\s+/g, '');
      this.transporter = nodemailer.createTransport({
        host: host || 'smtp.gmail.com',
        port: port || 587,
        secure: secure || false,
        auth: {
          user,
          pass: sanitizedPass,
        },
      });
      console.log(`📧 SMTP Email Transporter initialized with user: ${user}`);
    } else {
      console.log('ℹ️ SMTP credentials not provided. Email service will run in simulation mode.');
    }
  }

  /**
   * Dispatches an email via SMTP or falls back to simulation mode
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const defaultFrom = env.SMTP_FROM || (env.SMTP_USER ? `Nexora AI <${env.SMTP_USER}>` : 'Nexora AI <no-reply@nexora.ai>');

    if (this.transporter && (env.SMTP_USER || process.env.SMTP_USER)) {
      try {
        const info = await this.transporter.sendMail({
          from: defaultFrom,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html || options.text,
          replyTo: options.replyTo,
        });

        console.log(`✅ [SMTP] Email sent successfully to: ${options.to} (Message ID: ${info.messageId})`);
        return {
          success: true,
          messageId: info.messageId,
          recipient: options.to,
          status: 'sent',
        };
      } catch (error: any) {
        console.error(`❌ [SMTP ERROR] Failed to send email to ${options.to}:`, error.message);
        return {
          success: false,
          messageId: `err_${Date.now()}`,
          recipient: options.to,
          status: 'failed',
          error: error.message,
        };
      }
    } else {
      const mockId = `mock_mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[SIMULATED EMAIL DISPATCH]`);
      console.log(`  To: ${options.to}`);
      console.log(`  Subject: ${options.subject}`);
      console.log(`  Body Preview: ${(options.text || options.html || '').substring(0, 120)}...`);
      return {
        success: true,
        messageId: mockId,
        recipient: options.to,
        status: 'simulated',
      };
    }
  }

  /**
   * Verifies the SMTP connection
   */
  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return { success: false, message: 'Transporter not configured (missing SMTP_USER or SMTP_PASS)' };
    }
    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully!' };
    } catch (err: any) {
      return { success: false, message: `SMTP verification failed: ${err.message}` };
    }
  }
}

export const emailService = new EmailService();
