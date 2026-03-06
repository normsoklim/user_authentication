import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;
  private logger = new Logger(MailService.name);

  constructor() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    // Check if email credentials are provided
    if (emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    } else {
      this.logger.warn(
        'Email credentials not provided. Email sending will be disabled.',
      );
      this.transporter = null;
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    if (!this.transporter) {
      this.logger.warn(`EMAIL VERIFICATION TOKEN for ${email}: ${token}`);
      this.logger.warn(
        `Verification link: http://localhost:3000/auth/verify-email?token=${token}`,
      );
      return;
    }

    const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        to: email,
        subject: 'Verify your email',
        html: `
          <h3>Email Verification</h3>
          <p>Click the link below to verify your account:</p>
          <a href="${verificationLink}">${verificationLink}</a>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${error.message}`,
      );
      this.logger.warn(`EMAIL VERIFICATION TOKEN for ${email}: ${token}`);
      this.logger.warn(
        `Verification link: http://localhost:3000/auth/verify-email?token=${token}`,
      );
    }
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const resetLink = `http://localhost:3000/auth/reset-password?token=${token}`;

    if (!this.transporter) {
      this.logger.warn(`RESET TOKEN for ${email}: ${token}`);
      this.logger.warn(`Reset link: http://localhost:3000/auth/reset-password?token=${token}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        to: email,
        subject: 'Reset your password',
        html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
      });
      this.logger.log(`Reset password email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${email}: ${error.message}`,
      );
      this.logger.warn(`RESET TOKEN for ${email}: ${token}`);
      this.logger.warn(
        `Reset link: http://localhost:3000/auth/reset-password?token=${token}`,
      );
    }
  }
}
