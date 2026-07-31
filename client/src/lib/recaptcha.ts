/**
 * reCAPTCHA Enterprise Frontend Helper
 * Handles token generation for form submissions
 * 
 * Note: reCAPTCHA is disabled when VITE_RECAPTCHA_SITE_KEY is not configured
 * to avoid CSP (Content Security Policy) errors in development environment.
 */

declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  if (!window.grecaptcha?.enterprise?.ready) {
    return null;
  }

  try {
    return await new Promise((resolve) => {
      window.grecaptcha.enterprise.ready(async () => {
        try {
          const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action });
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
  if (!RECAPTCHA_SITE_KEY) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    if (window.grecaptcha?.enterprise) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

export function isRecaptchaEnabled(): boolean {
  return !!RECAPTCHA_SITE_KEY;
}

export function getRecaptchaSiteKey(): string {
  return RECAPTCHA_SITE_KEY;
}
