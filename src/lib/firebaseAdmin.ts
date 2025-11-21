import admin from 'firebase-admin';

// WHY: Initialize Firebase Admin SDK for server-side operations
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
  });
}

export const auth = admin.auth();
export const db = admin.firestore();

export default admin;
