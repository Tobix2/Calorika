
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

function initializeAdminApp() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please check your .env file.");
    }

    try {
        console.log("Firebase Admin SDK imported. Apps count:", admin.apps.length);
        if (admin.apps.length === 0) {
            const parsedAccount = JSON.parse(serviceAccount);
            // The private key from an environment variable needs newlines to be correctly formatted.
            parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');
            
            admin.initializeApp({
                credential: admin.credential.cert(parsedAccount),
            });
            console.log("🔥 Firebase Admin initialized successfully.");
        }
        return admin.app();
    } catch (error: any) {
        console.error("❌ Error initializing Firebase Admin:", error.message);
        throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
    }
}

export function getDb(): admin.firestore.Firestore {
  if (!db) {
    initializeAdminApp();
    db = admin.firestore();
  }
  return db;
}
