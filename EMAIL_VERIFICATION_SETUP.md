# Email Verification System

This document explains the email verification system implemented in the NestJS application.

## Overview

The email verification system ensures users confirm their email before using the system. This is common in production apps (Google, Facebook, GitHub, etc.).

## Flow

```
User Register
     ↓
Generate verification token
     ↓
Send verification email
     ↓
User clicks verification link
     ↓
Backend verifies token
     ↓
User account activated
```

## Implementation Details

### 1. User Schema Updates

The user schema has been updated with two new fields:

- `isEmailVerified`: Boolean field to track if the email is verified (default: false)
- `emailVerificationToken`: String field to store the verification token

### 2. Mail Service

A mail service has been created using Nodemailer to send verification emails:

- `MailService` handles sending emails
- Uses Gmail service by default (can be configured for other providers)
- Sends a verification link to the user's email

### 3. Registration Process

When a user registers:

1. A unique verification token is generated using UUID
2. User is created with `isEmailVerified: false` and the token stored
3. A verification email is sent to the user's email address
4. User receives a message to verify their email

### 4. Email Verification Endpoint

- Endpoint: `GET /auth/verify-email?token=xxx`
- Public endpoint (no authentication required)
- Verifies the token and marks the user's email as verified
- Removes the verification token from the database

### 5. Login Restrictions

- Users cannot login if their email is not verified
- Login attempts with unverified emails return a 401 error
- Error message: "Please verify your email first"

## Environment Variables

Add these to your `.env` file:

```env
EMAIL_USER=your-gmail-username@gmail.com
EMAIL_PASS=your-app-password
```

Note: For Gmail, you need to use an App Password, not your regular password.

## Handling Missing Email Configuration

If email credentials are not provided or email sending fails, the system will:
- Log a warning/error message
- Display the verification token in the console for testing purposes
- Continue with user registration but without sending the email
- Return success response to the client

This allows the application to run in development environments without email configuration and prevents registration failures due to email issues.

## Security Best Practices Implemented

- Unique random tokens generated using UUID
- Tokens are removed from the database after verification
- Email verification is required before login
- Public endpoint for verification (no auth required)

## Example Verification Email

Subject: Verify your email

```
Email Verification

Click the link below to verify your account:

http://localhost:3000/auth/verify-email?token=abc123
```

## API Endpoints

- `POST /auth/register` - Register user and send verification email
- `GET /auth/verify-email?token=xxx` - Verify email with token
- `POST /auth/login` - Login (requires verified email)