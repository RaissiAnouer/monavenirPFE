const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  debug: true,
  logger: true
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP Configuration Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

// Generate verification code (e.g., 6-digit number)
const generateVerificationCode = () => {
  // Generate a random 6-digit number
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString(); // Return as a string to handle leading zeros if Math.random() is very small
};

// Send verification email
const sendVerificationEmail = async (email, code, username) => {
  const mailOptions = {
    from: `"MonAvenir.tn" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to MonAvenir.tn - Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
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
              text-align: center;
              padding: 20px 0;
              background-color: #2563eb;
              color: white;
              border-radius: 8px 8px 0 0;
            }
            .content {
              padding: 30px;
              background-color: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 0 0 8px 8px;
            }
            .code-box {
              display: inline-block;
              padding: 15px 25px;
              margin: 20px 0;
              background-color: #f3f4f6; /* Tailwind gray-100 */
              color: #1f2937; /* Tailwind gray-800 */
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 5px;
              border-radius: 8px;
              border: 1px dashed #d1d5db; /* Tailwind gray-300 */
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to MonAvenir.tn</h1>
          </div>
          <div class="content">
            <h2>Hello ${username},</h2>
            <p>Thank you for joining MonAvenir.tn! Please use the following verification code to activate your account:</p>
            
            <div style="text-align: center;">
              <span class="code-box">${code}</span>
            </div>

            <p>Enter this code on the verification page to complete your registration.</p>

            <p><strong>Important:</strong> This verification code will expire in 24 hours.</p>
            
            <p>If you didn't create an account with MonAvenir.tn, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} MonAvenir.tn. All rights reserved.</p>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail
}; 
