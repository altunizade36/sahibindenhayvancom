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

const RECAPTCHA_SITE_KEY = '6LfkTSAsAAAAAC3pwCGqgDDODK0VWcXatiydbsz-';
const PROJECT_ID = 'sahibindenhayvan-55728';

export async function verifyRecaptcha(token: string, expectedAction: string, minScore = 0.5): Promise<boolean> {
  const apiKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  RECAPTCHA_SECRET_KEY (API Key) not configured. Bypassing verification in development.');
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
