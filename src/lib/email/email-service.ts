// src/lib/email/email-service.ts

import nodemailer from "nodemailer";

/**
 * Email Service for sending verification emails
 * Uses Nodemailer with SMTP configuration
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create email transporter
 * Uses environment variables for SMTP configuration
 */
function createTransporter() {
  // For development, you can use a service like Ethereal Email
  // For production, use your actual SMTP service (Gmail, SendGrid, etc.)
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email
 * @param {EmailOptions} options - Email configuration
 * @returns {Promise<boolean>} Success status
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send verification OTP email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} Success status
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  otp: string
): Promise<boolean> {
  const subject = "Verify Your Email - School ERP";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .otp-box {
          background-color: #f3f4f6;
          border: 2px dashed #6366f1;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #6366f1;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .otp-label {
          font-size: 14px;
          color: #6b7280;
          margin-top: 10px;
        }
        .content {
          color: #4b5563;
          font-size: 16px;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #6366f1;
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎓 School ERP</div>
          <h1 style="color: #111827; margin: 0;">Email Verification</h1>
        </div>
        
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          
          <p>Thank you for registering with School ERP. To complete your registration and verify your email address, please use the verification code below:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-label">Your Verification Code</div>
          </div>
          
          <p>Enter this code on the verification page to activate your account.</p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>This code will expire in <strong>15 minutes</strong></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please contact our support team.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} School ERP. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @returns {Promise<boolean>} Success status
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const subject = "Welcome to School ERP!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .success-icon {
          text-align: center;
          font-size: 48px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✅</div>
        <h1 style="color: #10b981; text-align: center;">Email Verified Successfully!</h1>
        
        <p>Hello <strong>${name}</strong>,</p>
        
        <p>Congratulations! Your email has been successfully verified. You now have full access to the School ERP system.</p>
        
        <p>You can now:</p>
        <ul>
          <li>Access your dashboard</li>
          <li>Manage your profile</li>
          <li>Use all system features</li>
        </ul>
        
        <p>If you have any questions, feel free to reach out to our support team.</p>
        
        <p>Best regards,<br>The School ERP Team</p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
}
