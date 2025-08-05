import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let db: admin.firestore.Firestore;

function initAdminApp() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }
    
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccount)),
            });
            console.log("🔥 Firebase Admin initialized successfully.");
        } catch (error: any) {
            console.error("❌ Error initializing Firebase Admin:", error.message);
            // Throw a more specific error to help with debugging
            throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
        }
    }
    db = getFirestore();
}

// Initialize on module load
initAdminApp();

export { db };
