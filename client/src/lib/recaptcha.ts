/**
 * reCAPTCHA v3 Frontend Helper
 * Handles token generation for form submissions
 * 
 * Note: reCAPTCHA is disabled when VITE_RECAPTCHA_SITE_KEY is not configured
 * to avoid CSP (Content Security Policy) errors in development environment.
 */

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export async function getRecaptchaToken(_action: string): Promise<string | null> {
  // Return null silently when not configured (no console warnings)
  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  // Wait for grecaptcha to load
  if (!window.grecaptcha || !window.grecaptcha.ready) {
    return null;
  }

  try {
    return await new Promise((resolve) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: _action });
          resolve(token);
        } catch {
          resolve(null);
        }
      });
    });
  } catch {
    return null;
  }
}

export function loadRecaptchaScript(): Promise<void> {
  // Don't load script if not configured (prevents CSP errors)
  if (!RECAPTCHA_SITE_KEY) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    if (window.grecaptcha) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve(); // Resolve instead of reject to prevent console errors
    document.head.appendChild(script);
  });
}
