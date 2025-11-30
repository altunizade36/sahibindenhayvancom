import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

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

// Initialize App Check with reCAPTCHA v3
// This is required because App Check is enforced on this Firebase project
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (RECAPTCHA_SITE_KEY) {
  try {
    // Enable debug mode in development
    if (import.meta.env.DEV) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.log('Firebase App Check initialized');
  } catch (error) {
    console.warn('Firebase App Check initialization failed:', error);
  }
}

export const auth = getAuth(app);

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
    // Check if container exists in DOM
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`reCAPTCHA container '${containerId}' not found in DOM yet, will retry on OTP send`);
      return null;
    }

    // Clear existing verifier if any
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Error clearing existing reCAPTCHA:', e);
      }
      window.recaptchaVerifier = undefined;
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (e) {
            console.warn('Error clearing expired reCAPTCHA:', e);
          }
          window.recaptchaVerifier = undefined;
        }
      }
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  } catch (error) {
    console.error('Error setting up reCAPTCHA:', error);
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
    // Clear recaptcha on error
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Error clearing reCAPTCHA after error:', e);
      }
      window.recaptchaVerifier = undefined;
    }
    
    // Translate common Firebase errors to Turkish
    const errorMessages: Record<string, string> = {
      'auth/invalid-phone-number': 'Geçersiz telefon numarası formatı',
      'auth/too-many-requests': 'Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.',
      'auth/quota-exceeded': 'SMS kotası aşıldı. Lütfen daha sonra tekrar deneyin.',
      'auth/captcha-check-failed': 'reCAPTCHA doğrulaması başarısız oldu',
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
