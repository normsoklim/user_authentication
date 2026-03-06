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
      this.logger.warn('Email credentials not provided. Email sending will be disabled.');
      this.transporter = null;
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    if (!this.transporter) {
      this.logger.warn(`EMAIL VERIFICATION TOKEN for ${email}: ${token}`);
      this.logger.warn(`Verification link: http://localhost:3000/auth/verify-email?token=${token}`);
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
      this.logger.error(`Failed to send verification email to ${email}: ${error.message}`);
      this.logger.warn(`EMAIL VERIFICATION TOKEN for ${email}: ${token}`);
      this.logger.warn(`Verification link: http://localhost:3000/auth/verify-email?token=${token}`);
    }
  }
}