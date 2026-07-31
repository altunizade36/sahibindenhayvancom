// Google reCAPTCHA Enterprise verification
// https://cloud.google.com/recaptcha-enterprise/docs/verify-token

export interface RecaptchaEnterpriseResponse {
  tokenProperties: {
    valid: boolean;
    invalidReason?: string;
    hostname?: string;
    action?: string;
    createTime?: string;
  };
  riskAnalysis: {
    score: number;
    reasons?: string[];
  };
  event: {
    token: string;
    siteKey: string;
    expectedAction?: string;
  };
  name: string;
}

// Site key gizli değildir (tarayıcıya gider) ama depo ile ortamı ayrı tutmak için
// ortam değişkeninden okunur.
const RECAPTCHA_SITE_KEY = process.env.VITE_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY;
const PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

export async function verifyRecaptcha(token: string, expectedAction: string, minScore = 0.5): Promise<boolean> {
  const apiKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!apiKey || !RECAPTCHA_SITE_KEY || !PROJECT_ID) {
    // Geliştirmede doğrulamayı atla; ÜRETİMDE kapalı kal (fail closed) —
    // aksi halde anahtar unutulduğunda spam koruması sessizce devre dışı kalır.
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ reCAPTCHA yapılandırılmamış (RECAPTCHA_SECRET_KEY / SITE_KEY / PROJECT_ID) — istek reddedildi.');
      return false;
    }
    console.warn('⚠️  reCAPTCHA yapılandırılmamış — geliştirme modunda doğrulama atlanıyor.');
    return true;
  }

  try {
    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: {
            token: token,
            expectedAction: expectedAction,
            siteKey: RECAPTCHA_SITE_KEY,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('reCAPTCHA Enterprise API error:', response.status, errorText);
      return false;
    }

    const data: RecaptchaEnterpriseResponse = await response.json();

    if (!data.tokenProperties?.valid) {
      console.error('reCAPTCHA token invalid:', data.tokenProperties?.invalidReason);
      return false;
    }

    if (expectedAction && data.tokenProperties.action !== expectedAction) {
      console.error(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.tokenProperties.action}`);
      return false;
    }

    const score = data.riskAnalysis?.score ?? 0;
    if (score < minScore) {
      console.warn(`reCAPTCHA score too low: ${score} < ${minScore}`, data.riskAnalysis?.reasons);
      return false;
    }

    console.log(`✅ reCAPTCHA verified: action=${expectedAction}, score=${score}`);
    return true;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// Simplified verify function for backward compatibility
export async function verifyRecaptchaSimple(token: string, minScore = 0.5): Promise<boolean> {
  return verifyRecaptcha(token, '', minScore);
}
