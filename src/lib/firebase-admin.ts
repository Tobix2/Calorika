
import 'dotenv/config';
import admin from 'firebase-admin';

let db: admin.firestore.Firestore;

function initializeAdminApp() {
  try {
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountRaw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }

    let parsedAccount;
    try {
      parsedAccount = JSON.parse(serviceAccountRaw);
    } catch (parseError) {
      console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', parseError);
      throw parseError;
    }

    if (parsedAccount.private_key) {
      parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(parsedAccount),
      });
      console.log('🔥 Firebase Admin SDK inicializado correctamente.');
    }

    return admin.app();

  } catch (error: any) {
    console.error('❌ Error general en initializeAdminApp:', error);
    // No relanzar el error para evitar crasheos, solo registrarlo.
    // La app puede funcionar sin admin en algunos casos.
    return null;
  }
}

export function getDb(): admin.firestore.Firestore {
  if (!db) {
    const app = initializeAdminApp();
    if (app) {
      db = app.firestore();
    } else {
        // Esto previene que la app crashee si el admin SDK no se pudo inicializar.
        // Las funciones que dependan de la DB fallarán de forma controlada.
        console.error("Firestore no pudo ser inicializado porque la app de Admin falló.")
        throw new Error("El servidor no pudo conectar con la base de datos.");
    }
  }
  return db;
}
