import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordReset,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  linkWithCredential,
  EmailAuthProvider,
  User,
  ActionCodeSettings
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCBqkJ4qJP0G5wNvnU7u2QkQXr5yVTRXkw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sahibindenhayvan-55728.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sahibindenhayvan-55728",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sahibindenhayvan-55728.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "391297918869",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:391297918869:web:4d10c85c9c5c810670789c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-L6M9FYENF1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Note: App Check is disabled - Authentication enforcement is set to "Unenforced" in Firebase Console
// Firebase Phone Auth uses its own invisible reCAPTCHA automatically

export const auth = getAuth(app);

// Set Turkish language for Firebase Auth (affects SMS messages, reCAPTCHA, etc.)
auth.languageCode = 'tr';

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

// Declare global type for recaptcha and dev mode
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
    confirmationResult: ConfirmationResult | undefined;
    devModeOTP?: boolean;
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

// Setup invisible reCAPTCHA - persistent widget
export function setupRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier | null {
  try {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('reCAPTCHA container not found:', containerId);
      return null;
    }

    // Clear any existing verifier first to avoid conflicts
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {
        // Silent cleanup
      }
      window.recaptchaVerifier = undefined;
    }

    // Clear the container content
    container.innerHTML = '';

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified successfully');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        window.recaptchaVerifier = undefined;
      },
      'error-callback': (error: any) => {
        console.error('reCAPTCHA error:', error);
        window.recaptchaVerifier = undefined;
      }
    });

    window.recaptchaVerifier = verifier;
    console.log('reCAPTCHA verifier created');
    return verifier;
  } catch (error) {
    console.error('reCAPTCHA setup error:', error);
    return null;
  }
}

// Ensure recaptcha is ready before sending OTP
async function ensureRecaptchaReady(containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> {
  // Wait for container to be in DOM
  let attempts = 0;
  while (!document.getElementById(containerId) && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!document.getElementById(containerId)) {
    throw new Error('reCAPTCHA container not found');
  }

  // Setup verifier (will reuse existing if available)
  const verifier = setupRecaptcha(containerId);
  if (!verifier) {
    throw new Error('reCAPTCHA doğrulaması başlatılamadı. Lütfen sayfayı yenileyin.');
  }

  // Render the reCAPTCHA widget (only renders once, subsequent calls are no-op)
  try {
    await verifier.render();
    console.log('reCAPTCHA ready');
  } catch (error: any) {
    // If already rendered, this is fine
    if (!error.message?.includes('already')) {
      console.error('reCAPTCHA render error:', error);
      // Clear and retry once
      window.recaptchaVerifier = undefined;
      const retryVerifier = setupRecaptcha(containerId);
      if (retryVerifier) {
        await retryVerifier.render();
        return retryVerifier;
      }
      throw new Error('reCAPTCHA doğrulaması yüklenemedi. Lütfen sayfayı yenileyin.');
    }
  }
  
  return verifier;
}

// Send OTP via Firebase - Real SMS verification
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

// Verify OTP code - Real Firebase verification
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

// ============================================
// GOOGLE SIGN-IN
// ============================================
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export async function signInWithGoogle(): Promise<{ idToken: string; user: User }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    return { idToken, user };
  } catch (error: any) {
    // If popup fails, try redirect method (better for mobile)
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
      console.log('Popup not supported, trying redirect...');
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Yönlendirme yapılıyor...');
    }
    
    const errorMessages: Record<string, string> = {
      'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı',
      'auth/popup-blocked': 'Pop-up engellendi. Lütfen tarayıcı ayarlarınızdan izin verin.',
      'auth/cancelled-popup-request': 'Giriş iptal edildi',
      'auth/account-exists-with-different-credential': 'Bu email başka bir giriş yöntemiyle kayıtlı',
      'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Google ile giriş başarısız';
    throw new Error(message);
  }
}

// ============================================
// EMAIL/PASSWORD AUTHENTICATION
// ============================================

// Register with email and password
export async function registerWithEmail(email: string, password: string): Promise<{ idToken: string; user: User }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send email verification
    await sendEmailVerification(user, {
      url: window.location.origin + '/giris',
      handleCodeInApp: false,
    });
    
    const idToken = await user.getIdToken();
    return { idToken, user };
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'Bu email adresi zaten kayıtlı',
      'auth/invalid-email': 'Geçersiz email adresi',
      'auth/operation-not-allowed': 'Email/şifre girişi aktif değil',
      'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter olmalı.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Kayıt başarısız';
    throw new Error(message);
  }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<{ idToken: string; user: User }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const idToken = await user.getIdToken();
    
    return { idToken, user };
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Geçersiz email adresi',
      'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
      'auth/user-not-found': 'Bu email ile kayıtlı kullanıcı bulunamadı',
      'auth/wrong-password': 'Yanlış şifre',
      'auth/invalid-credential': 'Email veya şifre hatalı',
      'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen bekleyin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Giriş başarısız';
    throw new Error(message);
  }
}

// Send password reset email
export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await firebaseSendPasswordReset(auth, email, {
      url: window.location.origin + '/giris',
      handleCodeInApp: false,
    });
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Geçersiz email adresi',
      'auth/user-not-found': 'Bu email ile kayıtlı kullanıcı bulunamadı',
    };
    
    const message = errorMessages[error.code] || error.message || 'Şifre sıfırlama emaili gönderilemedi';
    throw new Error(message);
  }
}

// Resend email verification
export async function resendEmailVerification(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Giriş yapmanız gerekiyor');
  }
  
  try {
    await sendEmailVerification(user, {
      url: window.location.origin + '/giris',
      handleCodeInApp: false,
    });
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      'auth/too-many-requests': 'Çok fazla istek. Lütfen bekleyin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Email gönderilemedi';
    throw new Error(message);
  }
}

// Check if current user's email is verified
export function isEmailVerified(): boolean {
  const user = auth.currentUser;
  return user?.emailVerified ?? false;
}

// Get current Firebase user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Sign out from Firebase
export async function signOutFirebase(): Promise<void> {
  await auth.signOut();
}

// ============================================
// FACEBOOK SIGN-IN
// ============================================
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export async function signInWithFacebook(): Promise<{ idToken: string; user: User }> {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    return { idToken, user };
  } catch (error: any) {
    // If popup fails, try redirect method (better for mobile)
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
      console.log('Popup not supported, trying redirect...');
      await signInWithRedirect(auth, facebookProvider);
      throw new Error('Yönlendirme yapılıyor...');
    }
    
    const errorMessages: Record<string, string> = {
      'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı',
      'auth/popup-blocked': 'Pop-up engellendi. Lütfen tarayıcı ayarlarınızdan izin verin.',
      'auth/cancelled-popup-request': 'Giriş iptal edildi',
      'auth/account-exists-with-different-credential': 'Bu email başka bir giriş yöntemiyle kayıtlı. Lütfen o yöntemi kullanın.',
      'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Facebook ile giriş başarısız';
    throw new Error(message);
  }
}

// ============================================
// TWITTER (X) SIGN-IN
// ============================================
const twitterProvider = new TwitterAuthProvider();

export async function signInWithTwitter(): Promise<{ idToken: string; user: User }> {
  try {
    const result = await signInWithPopup(auth, twitterProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    return { idToken, user };
  } catch (error: any) {
    // If popup fails, try redirect method (better for mobile)
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
      console.log('Popup not supported, trying redirect...');
      await signInWithRedirect(auth, twitterProvider);
      throw new Error('Yönlendirme yapılıyor...');
    }
    
    const errorMessages: Record<string, string> = {
      'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı',
      'auth/popup-blocked': 'Pop-up engellendi. Lütfen tarayıcı ayarlarınızdan izin verin.',
      'auth/cancelled-popup-request': 'Giriş iptal edildi',
      'auth/account-exists-with-different-credential': 'Bu email başka bir giriş yöntemiyle kayıtlı. Lütfen o yöntemi kullanın.',
      'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Twitter ile giriş başarısız';
    throw new Error(message);
  }
}

// ============================================
// APPLE SIGN-IN
// ============================================
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
// Set Turkish locale for Apple Sign-In screen
appleProvider.setCustomParameters({
  locale: 'tr_TR'
});

export async function signInWithApple(): Promise<{ idToken: string; user: User }> {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();
    
    return { idToken, user };
  } catch (error: any) {
    // If popup fails, try redirect method (better for mobile)
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
      console.log('Popup not supported, trying redirect...');
      await signInWithRedirect(auth, appleProvider);
      throw new Error('Yönlendirme yapılıyor...');
    }
    
    const errorMessages: Record<string, string> = {
      'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı',
      'auth/popup-blocked': 'Pop-up engellendi. Lütfen tarayıcı ayarlarınızdan izin verin.',
      'auth/cancelled-popup-request': 'Giriş iptal edildi',
      'auth/account-exists-with-different-credential': 'Bu email başka bir giriş yöntemiyle kayıtlı. Lütfen o yöntemi kullanın.',
      'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Apple ile giriş başarısız';
    throw new Error(message);
  }
}

// ============================================
// EMAIL LINK (MAGIC LINK) SIGN-IN - Passwordless
// ============================================
const EMAIL_FOR_SIGN_IN_KEY = 'emailForSignIn';

// Send sign-in link to email (Magic Link / Passwordless)
export async function sendEmailSignInLink(email: string): Promise<void> {
  const actionCodeSettings: ActionCodeSettings = {
    // URL to redirect to after email link is clicked
    url: `${window.location.origin}/email-giris-dogrula`,
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save email locally for when user returns via link
    window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Geçersiz email adresi',
      'auth/missing-email': 'Email adresi gerekli',
      'auth/quota-exceeded': 'Email kotası aşıldı. Lütfen daha sonra deneyin.',
      'auth/too-many-requests': 'Çok fazla istek. Lütfen bekleyin.',
    };
    
    const message = errorMessages[error.code] || error.message || 'Email bağlantısı gönderilemedi';
    throw new Error(message);
  }
}

// Check if current URL is an email sign-in link
export function isEmailSignInLink(url: string = window.location.href): boolean {
  return isSignInWithEmailLink(auth, url);
}

// Complete sign-in with email link
export async function completeEmailSignIn(email?: string): Promise<{ idToken: string; user: User }> {
  const url = window.location.href;
  
  if (!isSignInWithEmailLink(auth, url)) {
    throw new Error('Bu link geçerli bir oturum açma bağlantısı değil');
  }

  // Get email from localStorage or ask user
  let signInEmail = email || window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
  
  if (!signInEmail) {
    throw new Error('Email adresi gerekli. Lütfen linki aynı cihazda açın veya email adresinizi girin.');
  }

  try {
    const result = await signInWithEmailLink(auth, signInEmail, url);
    // Clear saved email
    window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
    
    const user = result.user;
    const idToken = await user.getIdToken();
    
    return { idToken, user };
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      'auth/expired-action-code': 'Bağlantının süresi dolmuş. Yeni bir bağlantı isteyin.',
      'auth/invalid-action-code': 'Geçersiz bağlantı. Yeni bir bağlantı isteyin.',
      'auth/invalid-email': 'Email adresi bağlantıyla eşleşmiyor',
      'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
    };
    
    const message = errorMessages[error.code] || error.message || 'Oturum açma başarısız';
    throw new Error(message);
  }
}

// Get saved email for sign-in (if user returns on same device)
export function getSavedEmailForSignIn(): string | null {
  return window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
}

// Link email credential to existing user
export async function linkEmailToAccount(email: string, url: string = window.location.href): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Önce oturum açmanız gerekiyor');
  }

  try {
    const credential = EmailAuthProvider.credentialWithLink(email, url);
    await linkWithCredential(user, credential);
    window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      'auth/provider-already-linked': 'Email zaten hesaba bağlı',
      'auth/email-already-in-use': 'Bu email başka bir hesaba bağlı',
      'auth/invalid-email': 'Geçersiz email adresi',
    };
    
    const message = errorMessages[error.code] || error.message || 'Email bağlama başarısız';
    throw new Error(message);
  }
}

// ============================================
// REDIRECT RESULT HANDLER (for social logins on mobile)
// ============================================
export async function handleRedirectResult(): Promise<{ idToken: string; user: User } | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const idToken = await result.user.getIdToken();
      return { idToken, user: result.user };
    }
    return null;
  } catch (error: any) {
    console.error('Redirect result error:', error);
    return null;
  }
}

export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult, User };
