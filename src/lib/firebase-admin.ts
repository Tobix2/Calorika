import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function getFirestoreDb() {
  if (!app) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
      console.warn("FIREBASE_SERVICE_ACCOUNT no está definido.");
      throw new Error("FIREBASE_SERVICE_ACCOUNT no está definido.");
    }

    try {
      const parsed = JSON.parse(serviceAccount);
      app = admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      console.log("🔥 Firebase Admin inicializado.");
    } catch (error) {
      console.error("❌ Error inicializando Firebase Admin:", error);
      throw new Error("Error inicializando Firebase Admin.");
    }
  }

  return admin.firestore(app);
}
