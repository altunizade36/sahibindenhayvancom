import crypto from "crypto";
import { Resend } from "resend";

/** İletişim formundan gelen mesaj. */
export interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/** Yeni mesaj bildirimi için gereken bilgiler. */
export interface NewMessageNotice {
  to: string;
  recipientName: string | null;
  senderName: string;
  preview: string;
  conversationId: string;
  listingTitle?: string | null;
}

/**
 * Genel olay bildirimi.
 *
 * İlan onaylandı, teklif geldi, iletişim talebi düştü... Bunların her biri
 * için ayrı bir e-posta şablonu yazmak yerine tek bir biçim kullanılıyor:
 * başlık, açıklama ve tek bir eylem düğmesi. Yeni bir olay eklemek için
 * e-posta katmanına dokunmak gerekmiyor.
 */
export interface EventNotice {
  to: string;
  recipientName?: string | null;
  title: string;
  body: string;
  /** Uygulama içi yol ("/ilan/123") ya da tam adres. */
  actionPath?: string;
  actionLabel?: string;
  /** Ek satırlar: "Teklif: 8.000 TL" gibi. */
  details?: Array<[string, string]>;
}

// Email service configuration
export interface EmailService {
  sendVerificationEmail(to: string, token: string, username: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string, username: string): Promise<void>;
  sendContactMessage(data: ContactMessage): Promise<void>;
  sendNewMessageNotice(data: NewMessageNotice): Promise<void>;
  sendEventNotice(data: EventNotice): Promise<void>;
}

/**
 * İletişim formu mesajlarının gideceği adres.
 *
 * Ortam değişkeninden okunur; depo herkese açık olduğu için kişisel adres
 * koda yazılmaz. Tanımlı değilse sitenin kamuya duyurulmuş adresi kullanılır.
 */
function contactRecipient(): string {
  return process.env.CONTACT_EMAIL || "info@sahibindenhayvan.com";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Generate secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Development email service - logs to console
// In dev mode, users are auto-verified (no email needed)
class DevelopmentEmailService implements EmailService {
  async sendVerificationEmail(to: string, token: string, username: string): Promise<void> {
    const verificationUrl = `${process.env.VITE_APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL DOĞRULAMA (DEV MODE - AUTO-VERIFIED)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Alıcı: ${to}`);
    console.log(`Kullanıcı: ${username}`);
    console.log(`ℹ️  Development mode: Kullanıcı otomatik doğrulandı`);
    console.log(`\n🔗 Manuel Test Linki (opsiyonel):`);
    console.log(verificationUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  async sendPasswordResetEmail(to: string, token: string, username: string): Promise<void> {
    const resetUrl = `${process.env.VITE_APP_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 ŞİFRE SIFIRLAMA (DEV MODE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Alıcı: ${to}`);
    console.log(`Kullanıcı: ${username}`);
    console.log(`\n🔗 Sıfırlama Linki:`);
    console.log(resetUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  async sendContactMessage(data: ContactMessage): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✉️  İLETİŞİM FORMU (DEV MODE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Alıcı: ${contactRecipient()}`);
    console.log(`Gönderen: ${data.name} <${data.email}> ${data.phone || ''}`);
    console.log(`Konu: ${data.subject}`);
    console.log(data.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  async sendNewMessageNotice(data: NewMessageNotice): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 YENİ MESAJ BİLDİRİMİ (DEV MODE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Alıcı: ${data.to}`);
    console.log(`Gönderen: ${data.senderName}`);
    console.log(`Önizleme: ${data.preview}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  async sendEventNotice(data: EventNotice): Promise<void> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔔 ${data.title.toUpperCase()} (DEV MODE)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Alıcı: ${data.to}`);
    console.log(data.body);
    (data.details || []).forEach(([k, v]) => console.log(`   ${k}: ${v}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// Production email service using Resend
class ProductionEmailService implements EmailService {
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required for production email service');
    }
    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@sahibindenhayvan.com';
  }

  async sendVerificationEmail(to: string, token: string, username: string): Promise<void> {
    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://sahibindenhayvan.com';
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;
    
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Email Adresinizi Doğrulayın - Sahibindenhayvan.com',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Email Doğrulama</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0066CC; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Sahibindenhayvan.com</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f5f5f5;">
              <h2 style="color: #333;">Merhaba ${username},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                Sahibindenhayvan.com'a hoş geldiniz! Hesabınızı aktifleştirmek için 
                email adresinizi doğrulamanız gerekmektedir.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #0066CC; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Email Adresimi Doğrula
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px;">
                Bu link 24 saat geçerlidir. Eğer bu hesabı siz oluşturmadıysanız, 
                bu emaili görmezden gelebilirsiniz.
              </p>
              
              <p style="color: #999; font-size: 12px;">
                Link çalışmıyorsa şu adresi tarayıcınıza kopyalayın:<br>
                ${verificationUrl}
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>© 2025 Sahibindenhayvan.com - Tüm hakları saklıdır.</p>
            </div>
          </body>
          </html>
        `,
      });
      
      console.log(`✅ Verification email sent to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Email gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    }
  }

  async sendPasswordResetEmail(to: string, token: string, username: string): Promise<void> {
    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://sahibindenhayvan.com';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Şifre Sıfırlama - Sahibindenhayvan.com',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Şifre Sıfırlama</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0066CC; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Sahibindenhayvan.com</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f5f5f5;">
              <h2 style="color: #333;">Merhaba ${username},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                Şifre sıfırlama talebiniz aldık. Yeni bir şifre oluşturmak için 
                aşağıdaki butona tıklayın.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #0066CC; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Şifremi Sıfırla
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px;">
                Bu link 24 saat geçerlidir. Eğer bu talebi siz yapmadıysanız, 
                bu emaili görmezden gelebilirsiniz.
              </p>
              
              <p style="color: #999; font-size: 12px;">
                Link çalışmıyorsa şu adresi tarayıcınıza kopyalayın:<br>
                ${resetUrl}
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>© 2025 Sahibindenhayvan.com - Tüm hakları saklıdır.</p>
            </div>
          </body>
          </html>
        `,
      });
      
      console.log(`✅ Password reset email sent to ${to}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Email gönderilemedi. Lütfen daha sonra tekrar deneyin.');
    }
  }

  /**
   * İletişim formu mesajını site sahibine iletir.
   *
   * `replyTo` gönderenin adresine ayarlanır: site sahibi gelen e-postaya
   * doğrudan "yanıtla" diyerek kullanıcıya ulaşabilir. `from` alanı kendi
   * doğrulanmış alan adımız olmalı — gönderenin adresini `from` yapmak
   * SPF/DKIM'i bozar ve e-postanın spam'e düşmesine yol açar.
   */
  async sendContactMessage(data: ContactMessage): Promise<void> {
    const alici = contactRecipient();
    const satir = (baslik: string, deger: string) =>
      `<tr><td style="padding:6px 12px;color:#666;white-space:nowrap">${baslik}</td>` +
      `<td style="padding:6px 12px"><b>${escapeHtml(deger)}</b></td></tr>`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: alici,
        replyTo: data.email,
        subject: `İletişim formu: ${data.subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0066CC;padding:16px;text-align:center">
              <h2 style="color:#fff;margin:0">sahibindenhayvan.com — İletişim Formu</h2>
            </div>
            <table style="width:100%;border-collapse:collapse;background:#f5f5f5">
              ${satir("Ad Soyad", data.name)}
              ${satir("E-posta", data.email)}
              ${data.phone ? satir("Telefon", data.phone) : ""}
              ${satir("Konu", data.subject)}
            </table>
            <div style="padding:20px;white-space:pre-wrap;line-height:1.6">${escapeHtml(data.message)}</div>
            <p style="padding:0 20px 20px;color:#999;font-size:12px">
              Bu e-postayı yanıtlarsanız doğrudan ${escapeHtml(data.email)} adresine ulaşır.
            </p>
          </div>
        `,
      });

      console.log(`✅ Contact form message forwarded to ${alici}`);
    } catch (error) {
      console.error('❌ Failed to forward contact message:', error);
      throw new Error('Mesaj iletilemedi.');
    }
  }

  /**
   * "Size yeni bir mesaj var" bildirimi.
   *
   * Mesajın tamamı DEĞİL, kısa bir önizlemesi gönderiliyor. İki nedeni var:
   * kullanıcıyı siteye çekmek ve pazarlığın e-posta üzerinden yürümesini
   * engellemek; ayrıca alıcının posta kutusuna düşen içerik en aza iniyor.
   */
  async sendNewMessageNotice(data: NewMessageNotice): Promise<void> {
    const appUrl = process.env.APP_URL || 'https://sahibindenhayvan.com';
    const link = `${appUrl}/mesajlar?conversationId=${encodeURIComponent(data.conversationId)}`;
    const hitap = data.recipientName ? `Merhaba ${escapeHtml(data.recipientName)},` : 'Merhaba,';

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: data.to,
        subject: `${data.senderName} size mesaj gönderdi`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0066CC;padding:20px;text-align:center">
              <h2 style="color:#fff;margin:0">sahibindenhayvan.com</h2>
            </div>
            <div style="padding:28px 24px;background:#f5f5f5">
              <p style="margin:0 0 12px">${hitap}</p>
              <p style="margin:0 0 18px">
                <b>${escapeHtml(data.senderName)}</b> size bir mesaj gönderdi${
                  data.listingTitle ? ` — <i>${escapeHtml(data.listingTitle)}</i>` : ''
                }.
              </p>
              <blockquote style="margin:0 0 22px;padding:12px 16px;background:#fff;border-left:3px solid #0066CC;color:#444">
                ${escapeHtml(data.preview)}
              </blockquote>
              <div style="text-align:center;margin:26px 0">
                <a href="${link}" style="background:#0066CC;color:#fff;padding:14px 28px;text-decoration:none;border-radius:5px;display:inline-block">
                  Mesajı Görüntüle
                </a>
              </div>
              <p style="color:#999;font-size:12px;margin:0">
                Bu bildirimleri istemiyorsanız hesap ayarlarınızdan kapatabilirsiniz.
              </p>
            </div>
          </div>
        `,
      });

      console.log(`✅ New message notice sent to ${data.to}`);
    } catch (error) {
      // Bildirim gönderilemese de mesaj gönderimi başarılıdır; hata yutuluyor.
      console.error('❌ Failed to send new message notice:', error);
    }
  }

  /**
   * Genel olay bildirimi (ilan onayı, teklif, iletişim talebi...).
   *
   * Tek bir biçim kullanılıyor: başlık, açıklama, isteğe bağlı ayrıntı satırları
   * ve tek bir eylem düğmesi. Böylece yeni bir olay türü eklerken burada
   * değişiklik gerekmiyor.
   */
  async sendEventNotice(data: EventNotice): Promise<void> {
    const appUrl = (process.env.APP_URL || 'https://sahibindenhayvan.com').replace(/\/$/, '');
    const link = data.actionPath
      ? (/^https?:\/\//i.test(data.actionPath) ? data.actionPath : `${appUrl}${data.actionPath}`)
      : appUrl;
    const hitap = data.recipientName ? `Merhaba ${escapeHtml(data.recipientName)},` : 'Merhaba,';

    const ayrinti = (data.details || [])
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 12px;color:#666;white-space:nowrap">${escapeHtml(k)}</td>` +
          `<td style="padding:6px 12px"><b>${escapeHtml(v)}</b></td></tr>`
      )
      .join('');

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: data.to,
        subject: data.title,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0066CC;padding:20px;text-align:center">
              <h2 style="color:#fff;margin:0">sahibindenhayvan.com</h2>
            </div>
            <div style="padding:28px 24px;background:#f5f5f5">
              <p style="margin:0 0 12px">${hitap}</p>
              <p style="margin:0 0 18px;font-size:16px">${escapeHtml(data.body)}</p>
              ${ayrinti ? `<table style="width:100%;border-collapse:collapse;background:#fff;margin-bottom:20px">${ayrinti}</table>` : ''}
              <div style="text-align:center;margin:26px 0">
                <a href="${link}" style="background:#0066CC;color:#fff;padding:14px 28px;text-decoration:none;border-radius:5px;display:inline-block">
                  ${escapeHtml(data.actionLabel || 'Siteye Git')}
                </a>
              </div>
              <p style="color:#999;font-size:12px;margin:0">
                Bu bildirimleri istemiyorsanız hesap ayarlarınızdan kapatabilirsiniz.
              </p>
            </div>
          </div>
        `,
      });

      console.log(`✅ Event notice "${data.title}" sent to ${data.to}`);
    } catch (error) {
      // Bildirim, tetikleyen işlemin başarısını etkilememeli.
      console.error('❌ Failed to send event notice:', error);
    }
  }
}

// Email service factory
// Selects appropriate service based on environment
function createEmailService(): EmailService {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasResendKey = !!process.env.RESEND_API_KEY;

  if (isDevelopment && !hasResendKey) {
    // Development mode without Resend - use mock service
    console.log('📧 Email Service: Development Mode (Auto-Verify Enabled)');
    return new DevelopmentEmailService();
  }

  if (hasResendKey) {
    // Production mode or dev with Resend configured
    console.log('📧 Email Service: Production Mode (Resend)');
    return new ProductionEmailService();
  }

  // Fallback to development service
  console.warn('⚠️  No email service configured - using development mode');
  return new DevelopmentEmailService();
}

// Check if auto-verify should be enabled
// Returns true only when RESEND_API_KEY is NOT configured (development mode)
export function shouldAutoVerifyEmail(): boolean {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  return !hasResendKey; // Auto-verify only in development mode (when no Resend key)
}

// Export email service instance
export const emailService: EmailService = createEmailService();
