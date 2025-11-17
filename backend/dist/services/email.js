import nodemailer from 'nodemailer';
import { FRONTEND_URL, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER, } from '../config/env.js';
let transporter = null;
function ensureTransporter() {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        throw new Error('Configuration SMTP incomplète : définissez SMTP_HOST, SMTP_USER et SMTP_PASS');
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    }
    return transporter;
}
export async function sendVerificationEmail(email, token) {
    const baseUrl = FRONTEND_URL.replace(/\/$/, '');
    const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const html = `
    <p>Bonjour,</p>
    <p>Merci pour votre inscription sur Secure App Paiement.</p>
    <p>Veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :</p>
    <p>
      <a
        href="${verificationUrl}"
        style="
          display: inline-block;
          padding: 12px 20px;
          border-radius: 6px;
          background-color: #0b57d0;
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
        "
      >
        Vérifier mon email
      </a>
    </p>
    <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>Ce lien expire dans 24 heures.</p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>
  `;
    const transporterInstance = ensureTransporter();
    await transporterInstance.sendMail({
        from: `"Secure App Paiement" <${SMTP_USER || 'no-reply@secure-app'}>`,
        to: email,
        subject: 'Vérification de votre adresse email',
        text: `Bonjour,
Merci pour votre inscription sur Secure App Paiement.
Veuillez confirmer votre adresse email via ce lien (valide 24h) : ${verificationUrl}
Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.`,
        html,
    });
}
export async function sendPasswordResetEmail(email, token) {
    const baseUrl = FRONTEND_URL.replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const html = `
    <p>Bonjour,</p>
    <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte Secure App Paiement.</p>
    <p>Si vous êtes à l'origine de cette demande, cliquez sur le bouton ci-dessous (valide 1h) :</p>
    <p>
      <a
        href="${resetUrl}"
        style="
          display: inline-block;
          padding: 12px 20px;
          border-radius: 6px;
          background-color: #0b57d0;
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
        "
      >
        Réinitialiser mon mot de passe
      </a>
    </p>
    <p>Vous pouvez également copier ce lien dans votre navigateur :</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message.</p>
  `;
    const transporterInstance = ensureTransporter();
    await transporterInstance.sendMail({
        from: `"Secure App Paiement" <${SMTP_USER || 'no-reply@secure-app'}>`,
        to: email,
        subject: 'Réinitialisation de mot de passe',
        text: `Bonjour,
Une demande de réinitialisation de mot de passe a été effectuée pour votre compte Secure App Paiement.
Si vous êtes à l'origine de cette demande, utilisez ce lien (valide 1h) : ${resetUrl}
Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
        html,
    });
}
//# sourceMappingURL=email.js.map