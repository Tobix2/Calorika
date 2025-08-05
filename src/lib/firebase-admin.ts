import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

function initializeAdminApp() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }

    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        const parsedAccount = JSON.parse(serviceAccount);
        parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');

        const app = admin.initializeApp({
            credential: admin.credential.cert(parsedAccount),
        });
        console.log("🔥 Firebase Admin initialized successfully.");
        return app;
    } catch (error: any) {
        console.error("❌ Error initializing Firebase Admin:", error.message);
        throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
    }
}

export function getDb(): admin.firestore.Firestore {
  if (!db) {
    const app = initializeAdminApp();
    db = admin.firestore(app);
  }
  return db;
}
