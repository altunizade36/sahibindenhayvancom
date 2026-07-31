import admin from 'firebase-admin';

// Firebase proje kimliği yalnızca ortamdan okunur (kaynak koda gömülmez).
const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseApp) {
    if (!FIREBASE_PROJECT_ID) {
      throw new Error(
        "FIREBASE_PROJECT_ID (veya VITE_FIREBASE_PROJECT_ID) tanımlı değil — " +
          "Firebase telefon doğrulaması kullanılamaz."
      );
    }

    // Check if already initialized
    if (admin.apps.length > 0) {
      firebaseApp = admin.apps[0]!;
    } else {
      // Check if service account credentials are provided
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (clientEmail && privateKey) {
        // Production mode with service account
        console.log('📱 Firebase Admin: Initializing with service account credentials');
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: clientEmail,
            privateKey: privateKey,
          }),
          projectId: FIREBASE_PROJECT_ID,
        });
      } else {
        // Development mode - using project ID only
        // Note: Token verification may fail without proper credentials
        console.log('📱 Firebase Admin: Development mode (credentials not provided)');
        console.log('   ⚠️  For production, set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY');
        firebaseApp = admin.initializeApp({
          projectId: FIREBASE_PROJECT_ID,
        });
      }
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
