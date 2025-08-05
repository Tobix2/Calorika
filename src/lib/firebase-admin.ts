import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

function initAdminApp() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    }
    
    if (!admin.apps.length) {
        try {
            const parsedAccount = JSON.parse(serviceAccount);
            // The private key from the environment variable needs its newlines restored.
            parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert(parsedAccount),
            });
            console.log("🔥 Firebase Admin initialized successfully.");
        } catch (error: any)
 {
            console.error("❌ Error initializing Firebase Admin:", error.message);
            throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
        }
    }

    db = admin.firestore();
}

// Initialize on module load
initAdminApp();

export { db };
