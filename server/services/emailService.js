const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not configured. Skipping welcome email.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for port 465
      pool: true,   // Use connection pooling for fast and reliable email sending
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      timeout: 10000 // 10 seconds timeout
    });

    const mailOptions = {
      from: `"Med-Verify Pro" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Welcome to Med-Verify Pro! 🩺',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
          <h2 style="color: #00e5cc; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Welcome to Med-Verify Pro, ${userName}!</h2>
          <p>Thank you for joining our platform. You are now equipped with an AI-powered clinical synthesis engine built for NBEC 2026.</p>
          <p>Start verifying medical claims against PubMed and OpenFDA databases today and earn points for your contributions!</p>
          <br/>
          <p style="border-top: 1px solid #f0f0f0; padding-top: 15px; font-size: 0.9em; color: #777;">
            Best regards,<br/>
            <strong>The Med-Verify Pro Team</strong>
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Welcome email sent successfully to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome email: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
};
