// Google reCAPTCHA v3 verification
// https://developers.google.com/recaptcha/docs/verify

export interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export async function verifyRecaptcha(token: string, minScore = 0.5): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    console.warn('⚠️  RECAPTCHA_SECRET_KEY not configured. Bypassing verification in development.');
    return true; // Allow in dev mode without key
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data: RecaptchaVerifyResponse = await response.json();

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return false;
    }

    // reCAPTCHA v3 returns a score (0.0 - 1.0)
    // 1.0 is very likely a good interaction, 0.0 is very likely a bot
    if (data.score !== undefined && data.score < minScore) {
      console.warn(`reCAPTCHA score too low: ${data.score} < ${minScore}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false; // Fail closed in production
  }
}

// Production setup instructions:
// 1. Get reCAPTCHA v3 keys from: https://www.google.com/recaptcha/admin
// 2. Add site key to frontend: VITE_RECAPTCHA_SITE_KEY
// 3. Add secret key to backend: RECAPTCHA_SECRET_KEY (as secret, not env var)
// 4. Uncomment the reCAPTCHA validation in /api/auth/register route
//
// Frontend implementation (React):
/*
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

function RegisterForm() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = async (data) => {
    if (!executeRecaptcha) {
      console.error('Execute recaptcha not yet available');
      return;
    }

    const token = await executeRecaptcha('register');
    
    // Send token with registration request
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, recaptchaToken: token }),
    });
  };
}
*/
