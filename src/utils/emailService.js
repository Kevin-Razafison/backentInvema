import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // smtp.gmail.com
  port: process.env.SMTP_PORT || 587,
  secure: false,                      // true si port 465 (SSL), false pour 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,      // ton adresse Gmail
    pass: process.env.SMTP_PASS,      // mot de passe d'application sans espaces
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Stock App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("✅ Email envoyé :", info.messageId);
    return info;
  } catch (err) {
    console.error(`❌ Erreur envoi email à ${to} :`, err);
    throw err;
  }
};