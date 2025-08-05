
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let db: admin.firestore.Firestore;

function initializeAdminApp() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }

    try {
        if (admin.apps.length === 0) {
            const parsedAccount = JSON.parse(serviceAccount);
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
    const app = initializeAdminApp();
    db = getFirestore(app);
  }
  return db;
}
