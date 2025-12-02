import crypto from "crypto";
import { Resend } from "resend";

// Email service configuration
export interface EmailService {
  sendVerificationEmail(to: string, token: string, username: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string, username: string): Promise<void>;
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
