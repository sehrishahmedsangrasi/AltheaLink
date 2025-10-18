const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
   
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    
    await transporter.sendMail({
      from: `"AltheaLink" <${process.env.EMAIL_USER}>`,
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
