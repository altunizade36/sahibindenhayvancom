import crypto from "crypto";

export interface SmsService {
  sendOtp(phone: string, code: string): Promise<boolean>;
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

class DevelopmentSmsService implements SmsService {
  async sendOtp(phone: string, code: string): Promise<boolean> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 SMS DOĞRULAMA KODU (DEV MODE)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Telefon: ${phone}`);
    console.log(`Doğrulama Kodu: ${code}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return true;
  }
}

class TwilioSmsService implements SmsService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('⚠️  Twilio credentials not configured - SMS will not be sent');
    }
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.error('❌ Twilio not configured');
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      
      const body = new URLSearchParams({
        To: formattedPhone,
        From: this.fromNumber,
        Body: `Sahibindenhayvan.com doğrulama kodunuz: ${code}. Bu kod 5 dakika geçerlidir.`,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Twilio error:', errorData);
        return false;
      }

      const result = await response.json();
      console.log(`✅ SMS sent to ${phone}, SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('90') && cleaned.length === 10) {
      cleaned = '90' + cleaned;
    }
    
    return '+' + cleaned;
  }
}

function createSmsService(): SmsService {
  const hasTwilio = !!(
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_PHONE_NUMBER
  );

  if (hasTwilio) {
    console.log('📱 SMS Service: Twilio Active');
    return new TwilioSmsService();
  }

  console.log('📱 SMS Service: Development Mode (Console Only)');
  return new DevelopmentSmsService();
}

export const smsService: SmsService = createSmsService();
export { generateOtp };
