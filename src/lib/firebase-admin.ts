import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccount) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
}

const serviceAccountConfig = JSON.parse(serviceAccount);

export function initAdminApp() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountConfig),
        });
    }
}
