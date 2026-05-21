const nodemailer = require('nodemailer');

const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not configured. Skipping welcome email.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or use host/port for other SMTP providers
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Med-Verify Pro" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Welcome to Med-Verify Pro! 🩺',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #00e5cc;">Welcome to Med-Verify Pro, ${userName}!</h2>
          <p>Thank you for joining our platform. You are now equipped with an AI-powered clinical synthesis engine built for NBEC 2026.</p>
          <p>Start verifying medical claims against PubMed and OpenFDA databases today and earn points for your contributions!</p>
          <br/>
          <p>Best regards,<br/>The Med-Verify Pro Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Welcome email sent to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome email: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
};
