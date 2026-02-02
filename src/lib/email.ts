import nodemailer from 'nodemailer';

// Create transporter - uses environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"GST Doc AI" <noreply@gstdocai.com>',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 40px; border: 1px solid #334155;">
          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 12px; border-radius: 12px;">
              <span style="font-size: 24px; color: white;">📄</span>
            </div>
            <h1 style="color: white; margin: 15px 0 5px; font-size: 24px;">GST Doc AI</h1>
          </div>
          
          <!-- Content -->
          <div style="text-align: center;">
            <h2 style="color: white; margin-bottom: 10px; font-size: 20px;">Verify Your Email Address</h2>
            <p style="color: #94a3b8; margin-bottom: 30px; line-height: 1.6;">
              Thank you for signing up! Please click the button below to verify your email address and activate your account.
            </p>
            
            <!-- Button -->
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Verify Email
            </a>
            
            <p style="color: #64748b; margin-top: 30px; font-size: 14px;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #10b981; word-break: break-all; font-size: 12px;">
              ${verificationUrl}
            </p>
            
            <p style="color: #64748b; margin-top: 30px; font-size: 12px;">
              This link will expire in 24 hours.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #334155; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify your email - GST Doc AI',
    html,
  });
}
