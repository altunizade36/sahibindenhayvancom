/**
 * reCAPTCHA v3 Frontend Helper
 * Handles token generation for form submissions
 */

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export async function getRecaptchaToken(action: string): Promise<string | null> {
  // If no site key configured, return null (optional in development)
  if (!RECAPTCHA_SITE_KEY) {
    console.warn('reCAPTCHA site key not configured - skipping verification');
    return null;
  }

  // Wait for grecaptcha to load
  if (!window.grecaptcha || !window.grecaptcha.ready) {
    console.error('reCAPTCHA not loaded');
    return null;
  }

  try {
    return await new Promise((resolve, reject) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
          resolve(token);
        } catch (error) {
          console.error('reCAPTCHA execution failed:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('reCAPTCHA token generation failed:', error);
    return null;
  }
}

export function loadRecaptchaScript(): Promise<void> {
  if (!RECAPTCHA_SITE_KEY) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
}
