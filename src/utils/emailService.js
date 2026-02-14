/**
 * ========================================
 * EMAIL SERVICE - VERSION AMÉLIORÉE
 * ========================================
 * 
 * Améliorations:
 * - Gestion d'erreurs robuste
 * - Retry automatique
 * - Templates HTML
 * - Validation des emails
 * - Rate limiting
 */

import nodemailer from "nodemailer";

// Configuration du transporteur
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true pour port 465 (SSL), false pour 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Options supplémentaires pour une meilleure fiabilité
  pool: true, // Utiliser un pool de connexions
  maxConnections: 5,
  maxMessages: 100,
});

// Vérifier la configuration au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur de configuration email:', error);
  } else {
    console.log('✅ Service email prêt');
  }
});

/**
 * Valider le format d'un email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Envoyer un email
 * @param {Object} options - Options d'envoi
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet
 * @param {string} options.html - Contenu HTML
 * @param {string} options.text - Contenu texte brut
 * @param {number} options.retries - Nombre de tentatives (défaut: 3)
 */
const sendEmail = async ({ to, subject, html, text, retries = 3 }) => {
  // Validation
  if (!to || !isValidEmail(to)) {
    throw new Error(`Email destinataire invalide: ${to}`);
  }

  if (!subject) {
    throw new Error('Le sujet de l\'email est requis');
  }

  if (!html && !text) {
    throw new Error('Le contenu de l\'email (html ou text) est requis');
  }

  // Tentatives d'envoi avec retry
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Stock App'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || '', // Fallback si pas de texte
        html: html || text, // Fallback sur texte si pas de HTML
      });

      console.log(
        `✅ Email envoyé avec succès à ${to} ` +
        `(ID: ${info.messageId}, Tentative: ${attempt}/${retries})`
      );

      return info;

    } catch (err) {
      lastError = err;
      console.error(
        `⚠️ Tentative ${attempt}/${retries} échouée pour ${to}:`,
        err.message
      );

      // Attendre avant de réessayer (sauf dernière tentative)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Toutes les tentatives ont échoué
  console.error(`❌ Échec d'envoi email à ${to} après ${retries} tentatives`);
  throw lastError;
};

/**
 * Envoyer plusieurs emails en batch
 */
const sendBatchEmails = async (emails, options = {}) => {
  const { concurrency = 5 } = options;
  const results = [];

  // Envoyer par lots pour éviter de surcharger
  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency);
    
    const batchResults = await Promise.allSettled(
      batch.map(email => sendEmail(email))
    );

    results.push(...batchResults);
  }

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(
    `📧 Batch emails: ${successful} réussis, ${failed} échoués sur ${emails.length} total`
  );

  return results;
};

/**
 * Template HTML de base pour les emails
 */
const createEmailTemplate = ({ title, content, footer }) => {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
          background-color: #4f46e5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9fafb;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          margin: 10px 5px;
          background-color: #4f46e5;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        }
        .button.success {
          background-color: #22c55e;
        }
        .button.danger {
          background-color: #ef4444;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      ${footer ? `<div class="footer">${footer}</div>` : ''}
    </body>
    </html>
  `;
};

/**
 * Templates d'emails prédéfinis
 */
const emailTemplates = {
  /**
   * Email de bienvenue
   */
  welcome: (userName) => ({
    subject: 'Bienvenue dans notre application',
    html: createEmailTemplate({
      title: 'Bienvenue !',
      content: `
        <p>Bonjour ${userName},</p>
        <p>Bienvenue dans notre application de gestion de stock !</p>
        <p>Votre compte a été créé avec succès.</p>
      `,
      footer: 'Ceci est un email automatique, merci de ne pas y répondre.'
    })
  }),

  /**
   * Email de commande
   */
  orderNotification: (supplierName, orderId, items, confirmUrl, rejectUrl) => ({
    subject: `Nouvelle commande #${orderId}`,
    html: createEmailTemplate({
      title: `Nouvelle Commande #${orderId}`,
      content: `
        <p>Bonjour ${supplierName},</p>
        <p>Vous avez reçu une nouvelle commande contenant ${items.length} article(s).</p>
        <h3>Détails de la commande:</h3>
        <ul>
          ${items.map(item => `
            <li>${item.product.name} - Quantité: ${item.quantity}</li>
          `).join('')}
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmUrl}" class="button success">✓ Confirmer</a>
          <a href="${rejectUrl}" class="button danger">✗ Rejeter</a>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Ce lien est valable pendant 24 heures.
        </p>
      `,
      footer: 'Merci de votre collaboration.'
    })
  }),

  /**
   * Email de réinitialisation de mot de passe
   */
  passwordReset: (userName, resetUrl) => ({
    subject: 'Réinitialisation de votre mot de passe',
    html: createEmailTemplate({
      title: 'Réinitialisation du mot de passe',
      content: `
        <p>Bonjour ${userName},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
      `,
      footer: 'Ce lien expirera dans 1 heure.'
    })
  }),

  /**
   * Email d'alerte de stock bas
   */
  lowStockAlert: (productName, currentStock, alertLevel) => ({
    subject: `Alerte stock bas: ${productName}`,
    html: createEmailTemplate({
      title: 'Alerte Stock Bas',
      content: `
        <p><strong>⚠️ Attention:</strong> Le stock du produit suivant est faible.</p>
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Produit:</strong> ${productName}</p>
          <p><strong>Stock actuel:</strong> ${currentStock} unités</p>
          <p><strong>Seuil d'alerte:</strong> ${alertLevel} unités</p>
        </div>
        <p>Merci de procéder à une commande de réapprovisionnement.</p>
      `,
      footer: 'Notification automatique du système de gestion de stock.'
    })
  })
};

export { 
  sendEmail, 
  sendBatchEmails, 
  createEmailTemplate, 
  emailTemplates,
  isValidEmail 
};