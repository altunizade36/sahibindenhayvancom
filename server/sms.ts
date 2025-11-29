import crypto from "crypto";

export interface SmsService {
  sendOtp(phone: string, code: string): Promise<boolean>;
}

export interface PhoneValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

export function validateAndNormalizeTurkishPhone(phone: string): PhoneValidationResult {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  const patterns = [
    /^0(5\d{9})$/,
    /^(5\d{9})$/,
    /^\+90(5\d{9})$/,
    /^90(5\d{9})$/,
    /^00(905\d{9})$/,
  ];
  
  let mobileNumber: string | null = null;
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      mobileNumber = match[1] || cleaned.replace(/^(\+90|90|0090|0)/, '');
      break;
    }
  }
  
  if (!mobileNumber) {
    const numericOnly = cleaned.replace(/\D/g, '');
    if (numericOnly.length === 10 && numericOnly.startsWith('5')) {
      mobileNumber = numericOnly;
    } else if (numericOnly.length === 11 && numericOnly.startsWith('05')) {
      mobileNumber = numericOnly.substring(1);
    } else if (numericOnly.length === 12 && numericOnly.startsWith('905')) {
      mobileNumber = numericOnly.substring(2);
    }
  }
  
  if (!mobileNumber || mobileNumber.length !== 10 || !mobileNumber.startsWith('5')) {
    return {
      valid: false,
      normalized: '',
      error: 'Geçerli bir Türkiye cep telefonu numarası girin (05XX XXX XX XX)',
    };
  }
  
  const validPrefixes = ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];
  const prefix = mobileNumber.substring(0, 2);
  
  if (!validPrefixes.includes(prefix)) {
    return {
      valid: false,
      normalized: '',
      error: 'Geçersiz operatör kodu. Geçerli kodlar: 50-59',
    };
  }
  
  return {
    valid: true,
    normalized: '0' + mobileNumber,
  };
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
