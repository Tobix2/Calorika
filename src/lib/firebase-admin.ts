
import 'dotenv/config';
import admin from 'firebase-admin';

let db: admin.firestore.Firestore;

function initializeAdminApp() {
  // Check if the app is already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountRaw) {
    console.error('❌ FATAL: FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    throw new Error('Server configuration error: Firebase service account not found.');
  }

  let parsedAccount;
  try {
    parsedAccount = JSON.parse(serviceAccountRaw);
  } catch (parseError) {
    console.error('❌ FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT JSON.', parseError);
    throw new Error('Server configuration error: Could not parse Firebase service account.');
  }
  
  // The private key needs newlines to be correctly parsed.
  if (parsedAccount.private_key) {
    parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(parsedAccount),
    });
    console.log('🔥 Firebase Admin SDK inicializado correctamente.');
    return app;
  } catch (initError) {
    console.error('❌ FATAL: Error initializing Firebase Admin SDK:', initError);
    throw new Error('Server configuration error: Could not initialize Firebase Admin SDK.');
  }
}

export function getDb(): admin.firestore.Firestore {
  if (!db) {
    try {
      const app = initializeAdminApp();
      db = app.firestore();
    } catch (error) {
      // If initialization fails, we re-throw the error to ensure server-side functions
      // that depend on the DB do not run in a broken state.
      console.error("🔥 Firestore no pudo ser inicializado. Las acciones del servidor fallarán.", error);
      throw new Error("El servidor no pudo conectar con la base de datos. Verifica la configuración del servidor.");
    }
  }
  return db;
}
