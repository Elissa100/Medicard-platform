import nodemailer from 'nodemailer';

const BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER = process.env.BREVO_SENDER || 'Medcard<noreply@medcard.rw>';

/**
 * Create Brevo transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: BREVO_API_KEY,
      pass: BREVO_SMTP_KEY,
    },
  });
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email, code) {
  const transporter = createTransporter();

  const mailOptions = {
    from: BREVO_SENDER,
    to: email,
    subject: 'MedCard - Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .code {
            background: #1e3a8a;
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            background: #0d9488;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MedCard</h1>
          <p>Your Personal Health Vault</p>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with MedCard. To complete your registration, please use the following verification code:</p>
          
          <div class="code">${code}</div>
          
          <p>This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.</p>
          
          <p>If you have any questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 MedCard. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail(email, firstName, plan) {
  const transporter = createTransporter();

  const mailOptions = {
    from: BREVO_SENDER,
    to: email,
    subject: 'Welcome to MedCard!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MedCard</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .plan-badge {
            background: #0d9488;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            margin: 10px 0;
          }
          .button {
            display: inline-block;
            background: #0d9488;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MedCard</h1>
          <p>Your Personal Health Vault</p>
        </div>
        <div class="content">
          <h2>Welcome, ${firstName}!</h2>
          <p>Your MedCard account has been successfully created.</p>
          
          <p><strong>Your Plan:</strong> <span class="plan-badge">${plan}</span></p>
          
          <p>You can now access your personal health vault and enjoy the benefits of your subscription.</p>
          
          <ul>
            <li>Secure storage of your medical records</li>
            <li>Instant NFC data retrieval</li>
            <li>Access to clinical history</li>
            ${plan === 'PREMIUM' ? '<li>Unlimited document uploads</li><li>Multi-sector linkage</li><li>Priority data backup</li>' : ''}
          </ul>
          
          <p>To access your vault, simply log in to your account.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 MedCard. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false };
  }
}
