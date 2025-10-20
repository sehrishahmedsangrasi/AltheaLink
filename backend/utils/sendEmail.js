// sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    // Create transporter using Mailtrap SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST, 
      port: process.env.MAILTRAP_PORT, 
      auth: {
        user: process.env.MAILTRAP_USER, 
        pass: process.env.MAILTRAP_PASS, 
      },
    });

    // Send mail
    await transporter.sendMail({
      from: `"AltheaLink" <no-reply@althealink.com>`, 
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Email send failed:", error);
  }
};

module.exports = sendEmail;
