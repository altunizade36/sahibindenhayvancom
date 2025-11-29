import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Using environment variables for production or hardcoded for development
const firebaseConfig = {
  projectId: "sahibindenhayvan-55728",
  // For production, you would use a service account key
  // For development, we use the project ID only
};

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseApp) {
    // Check if already initialized
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0]!;
    } else {
      firebaseApp = admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  }
  return firebaseApp;
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken | null> {
  try {
    const app = getFirebaseAdmin();
    const decodedToken = await app.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    console.error('Firebase token verification failed:', error.message);
    return null;
  }
}

export function formatPhoneFromFirebase(phone: string): string {
  // Firebase returns phone in format +905XXXXXXXXX
  // We want to normalize to +905XXXXXXXXX format
  if (phone.startsWith('+90')) {
    return phone;
  }
  if (phone.startsWith('90')) {
    return '+' + phone;
  }
  if (phone.startsWith('0')) {
    return '+90' + phone.substring(1);
  }
  return '+90' + phone;
}
