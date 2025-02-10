import { getFirestore } from 'firebase-admin/firestore';

const databaseId =
  process.env.NODE_ENV === 'development' ? 'env-dev' : '(default)';
const adminDB = getFirestore(databaseId);

export { adminDB };
