import crypto from "crypto";

// Email service configuration
// In production, integrate with services like SendGrid, AWS SES, or Resend
export interface EmailService {
  sendVerificationEmail(to: string, token: string, username: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string, username: string): Promise<void>;
}

// Generate secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Mock email service for development
// PRODUCTION: Replace with real email service
class MockEmailService implements EmailService {
  async sendVerificationEmail(to: string, token: string, username: string): Promise<void> {
    const verificationUrl = `${process.env.VITE_APP_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL DOĞRULAMA (DEV MODE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Alıcı: ${to}`);
    console.log(`Kullanıcı: ${username}`);
    console.log(`Token: ${token}`);
    console.log(`\n🔗 Doğrulama Linki:`);
    console.log(verificationUrl);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // PRODUCTION: Send actual email here
    // Example with SendGrid:
    // await sgMail.send({
    //   to,
    //   from: 'noreply@sahibindenhayvan.com',
    //   subject: 'Email Adresinizi Doğrulayın',
    //   html: `
    //     <h2>Merhaba ${username},</h2>
    //     <p>Sahibindenhayvan.com'a hoş geldiniz!</p>
    //     <p>Email adresinizi doğrulamak için aşağıdaki linke tıklayın:</p>
    //     <a href="${verificationUrl}">Email Adresimi Doğrula</a>
    //     <p>Bu link 24 saat geçerlidir.</p>
    //   `
    // });
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
    
    // PRODUCTION: Send actual email
  }
}

// Production email service (example with SendGrid)
// Uncomment and configure when deploying
/*
import sgMail from '@sendgrid/mail';

class ProductionEmailService implements EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendVerificationEmail(to: string, token: string, username: string): Promise<void> {
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
    
    await sgMail.send({
      to,
      from: 'noreply@sahibindenhayvan.com',
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
  }

  async sendPasswordResetEmail(to: string, token: string, username: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
    
    await sgMail.send({
      to,
      from: 'noreply@sahibindenhayvan.com',
      subject: 'Şifre Sıfırlama - Sahibindenhayvan.com',
      html: `
        // Similar HTML template for password reset
      `,
    });
  }
}
*/

// Export email service instance
// Use mock in development, production service when deployed
export const emailService: EmailService = new MockEmailService();
// export const emailService: EmailService = new ProductionEmailService(); // For production
