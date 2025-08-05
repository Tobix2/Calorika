
import admin from 'firebase-admin';

let db: admin.firestore.Firestore;

function initializeAdminApp() {
  try {
    // 1. Leer variable de entorno y mostrarla
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    console.log('🔥 FIREBASE_SERVICE_ACCOUNT raw:', serviceAccountRaw);

    if (!serviceAccountRaw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
    }

    // 2. Parsear JSON con try-catch
    let parsedAccount;
    try {
      parsedAccount = JSON.parse(serviceAccountRaw);
    } catch (parseError) {
      console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', parseError);
      throw parseError;
    }
    console.log('✅ parsedAccount keys:', Object.keys(parsedAccount));

    // 3. Revisar private_key y formatear saltos de línea
    if (!parsedAccount.private_key) {
      throw new Error('private_key is missing in the service account.');
    }
    console.log('🔑 private_key (sin formatear):', parsedAccount.private_key);
    parsedAccount.private_key = parsedAccount.private_key.replace(/\\n/g, '\n');
    console.log('🔑 private_key (formateado):', parsedAccount.private_key);

    // 4. Estado de apps antes de inicializar
    console.log('Apps antes de initializeApp:', admin.apps.length);

    // 5. Inicializar app solo si no está inicializada
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(parsedAccount),
      });
      console.log('🔥 Firebase Admin SDK inicializado correctamente.');
    } else {
      console.log('⚠️ Firebase Admin SDK ya estaba inicializado.');
    }

    // 6. Estado de apps después de inicializar
    console.log('Apps después de initializeApp:', admin.apps.length);

    // 7. Obtener app por defecto y mostrar nombre
    const app = admin.app();
    console.log('App name:', app.name);

    return app;

  } catch (error: any) {
    console.error('❌ Error general en initializeAdminApp:', error);
    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
}

export function getDb(): admin.firestore.Firestore {
  console.log('⏳ Entrando a getDb()');

  if (!db) {
    console.log('🔄 La instancia de Firestore no existe. Inicializando...');
    const app = initializeAdminApp();

    try {
      db = app.firestore();
      console.log('✅ Firestore inicializado correctamente.');
    } catch (error) {
      console.error('❌ Error al obtener instancia Firestore:', error);
      throw error;
    }
  } else {
    console.log('✔️ Ya existe instancia de Firestore.');
  }

  return db;
}
