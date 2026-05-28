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

const sendOtpEmail = async (userEmail, otpCode) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not configured. Skipping OTP email.');
      console.log(`🔑 [DEVELOPMENT BYPASS] OTP for ${userEmail} is: ${otpCode}`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      pool: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      timeout: 10000
    });

    const mailOptions = {
      from: `"Med-Verify Pro Secure" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `Your Med-Verify Pro Security Code: ${otpCode} 🔐`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #fcfcfc;">
          <h2 style="color: #00bfa6; margin-top: 0;">Med-Verify Pro Verification Code</h2>
          <p>Hello,</p>
          <p>You requested a secure login/registration on Med-Verify Pro. Please enter the following One-Time Password (OTP) to complete your access:</p>
          <div style="background-color: #f0fdfa; border: 1px dashed #00e5cc; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #004d40; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="font-size: 0.9em; color: #666;">This code is valid for 10 minutes and can only be used once. If you did not initiate this request, you can safely ignore this email.</p>
          <br/>
          <p style="border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 0.85em; color: #888;">
            Securely dispatched under ABDM & NBEC 2026 guidelines.<br/>
            <strong>The Med-Verify Pro Security Team</strong>
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ OTP email sent successfully to ${userEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send OTP email: ${error.message}`);
    return false;
  }
};

const sendContactEmail = async (name, email, subject, message) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP credentials not configured. Skipping contact email dispatch.');
      console.log(`✉️ [DEVELOPMENT BYPASS] Contact message from ${name} (${email}):\nSubject: ${subject}\nMessage: ${message}`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      pool: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      timeout: 10000
    });

    const mailOptions = {
      from: `"Med-Verify Feedback" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: `Med-Verify Pro Contact: ${subject} ✉️`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; background-color: #fcfcfc;">
          <h2 style="color: #5e35b1; margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">New Contact Submission</h2>
          <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background-color: #f5f3ff; border-left: 4px solid #7c4dff; border-radius: 4px; padding: 16px; margin: 20px 0; font-style: italic;">
            "${message.replace(/\n/g, '<br/>')}"
          </div>
          <br/>
          <p style="border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 0.85em; color: #888;">
            Submitted securely via Med-Verify Pro Contact Portal.<br/>
            <strong>Med-Verify Systems Admin</strong>
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Contact form email dispatched from ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send contact form email: ${error.message}`);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOtpEmail,
  sendContactEmail,
};
