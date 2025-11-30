import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCBqkJ4qJP0G5wNvnU7u2QkQXr5yVTRXkw",
  authDomain: "sahibindenhayvan-55728.firebaseapp.com",
  projectId: "sahibindenhayvan-55728",
  storageBucket: "sahibindenhayvan-55728.firebasestorage.app",
  messagingSenderId: "391297918869",
  appId: "1:391297918869:web:4d10c85c9c5c810670789c",
  measurementId: "G-L6M9FYENF1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Note: App Check is disabled - Authentication enforcement is set to "Unenforced" in Firebase Console
// Firebase Phone Auth uses its own invisible reCAPTCHA automatically

export const auth = getAuth(app);

// Rate limit key for cleanup only
const RATE_LIMIT_KEY = 'firebase_phone_rate_limit';

// Legacy cleanup - remove old rate limits
export function clearRateLimit(): void {
  localStorage.removeItem(RATE_LIMIT_KEY);
}

// Always return false - let Firebase handle rate limiting
export function isRateLimited(): boolean {
  return false;
}

export function getRateLimitRemaining(): number {
  return 0;
}

// Declare global type for recaptcha
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
    confirmationResult: ConfirmationResult | undefined;
  }
}

// Format Turkish phone number to international format
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +90
  if (digits.startsWith('0')) {
    return '+90' + digits.substring(1);
  }
  
  // If starts with 90, add +
  if (digits.startsWith('90') && digits.length === 12) {
    return '+' + digits;
  }
  
  // If already has country code
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: assume Turkish number without leading 0
  return '+90' + digits;
}

// Setup invisible reCAPTCHA with retry mechanism
export function setupRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  try {
    const container = document.getElementById(containerId);
    if (!container) {
      return null;
    }

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Silent cleanup
      }
      window.recaptchaVerifier = undefined;
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch {
            // Silent cleanup
          }
          window.recaptchaVerifier = undefined;
        }
      }
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  } catch {
    return null;
  }
}

// Ensure recaptcha is ready before sending OTP
async function ensureRecaptchaReady(containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> {
  // Wait for container to be in DOM
  let attempts = 0;
  while (!document.getElementById(containerId) && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!document.getElementById(containerId)) {
    throw new Error('reCAPTCHA container not found after waiting');
  }

  // Setup or reuse existing verifier
  if (!window.recaptchaVerifier) {
    const verifier = setupRecaptcha(containerId);
    if (!verifier) {
      throw new Error('reCAPTCHA doğrulaması başlatılamadı');
    }
    return verifier;
  }
  
  return window.recaptchaVerifier;
}

// Send OTP via Firebase
export async function sendFirebaseOTP(phoneNumber: string): Promise<ConfirmationResult> {
  // Clear any legacy rate limits
  clearRateLimit();
  
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Ensure recaptcha is ready (waits for DOM if needed)
  const verifier = await ensureRecaptchaReady();

  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth, 
      formattedPhone, 
      verifier
    );
    
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error: any) {
    // Handle rate limit error from Firebase
    if (error.code === 'auth/too-many-requests') {
      throw new Error(`Çok fazla deneme yaptınız. Biraz bekleyip tekrar deneyin.`);
    }

    // Only clear recaptcha for non-rate-limit errors
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Silent cleanup
      }
      window.recaptchaVerifier = undefined;
    }
    
    // Translate common Firebase errors to Turkish
    const errorMessages: Record<string, string> = {
      'auth/invalid-phone-number': 'Geçersiz telefon numarası formatı',
      'auth/quota-exceeded': 'SMS kotası aşıldı. Lütfen daha sonra tekrar deneyin.',
      'auth/captcha-check-failed': 'reCAPTCHA doğrulaması başarısız oldu. Lütfen sayfayı yenileyin.',
      'auth/missing-phone-number': 'Telefon numarası gerekli',
      'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
      'auth/firebase-app-check-token-is-invalid': 'Güvenlik doğrulaması başarısız oldu. Lütfen sayfayı yenileyin ve tekrar deneyin.',
      'auth/app-check-token-is-invalid': 'Güvenlik doğrulaması başarısız oldu. Lütfen sayfayı yenileyin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'SMS gönderilemedi';
    throw new Error(message);
  }
}

// Verify OTP code
export async function verifyFirebaseOTP(code: string): Promise<string> {
  if (!window.confirmationResult) {
    throw new Error('Önce telefon numarasına kod göndermeniz gerekiyor');
  }

  try {
    const result = await window.confirmationResult.confirm(code);
    const user = result.user;
    
    // Get the ID token to send to backend
    const idToken = await user.getIdToken();
    
    return idToken;
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      'auth/invalid-verification-code': 'Geçersiz doğrulama kodu',
      'auth/code-expired': 'Doğrulama kodunun süresi doldu. Yeni kod isteyin.',
      'auth/session-expired': 'Oturum süresi doldu. Lütfen tekrar deneyin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Doğrulama başarısız';
    throw new Error(message);
  }
}

// Cleanup function
export function cleanupRecaptcha(): void {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
    window.recaptchaVerifier = undefined;
  }
  window.confirmationResult = undefined;
}

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
