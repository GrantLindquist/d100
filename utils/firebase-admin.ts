import admin, { ServiceAccount } from 'firebase-admin';

const { privateKey } = JSON.parse(process.env.FIREBASE_PRIVATE_KEY!);

const serviceAccount: ServiceAccount = {
  projectId: 'd100-7cb14',
  privateKey: privateKey,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  admin.firestore().settings({
    databaseId:
      process.env.NODE_ENV === 'development' ? 'env-dev' : '(default)',
  });
}

export const adminDB = admin.firestore();
