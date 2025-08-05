import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccount) {
    console.warn("FIREBASE_SERVICE_ACCOUNT is not set. Server-side Firebase services will not be available.");
}

function initAdminApp() {
    if (serviceAccount && !admin.apps.length) {
        try {
            const serviceAccountConfig = JSON.parse(serviceAccount);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountConfig),
            });
            console.log("Firebase Admin SDK initialized successfully.");
        } catch (error) {
            console.error("🔥 Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize Firebase Admin SDK:", error);
        }
    }
}

// Llama a la inicialización inmediatamente para que esté lista para cualquier importación.
initAdminApp();

// Exporta una instancia de Firestore que solo se creará si el admin se inicializó correctamente.
// Si no hay serviceAccount, db será null.
export const db = admin.apps.length ? getFirestore() : null;
