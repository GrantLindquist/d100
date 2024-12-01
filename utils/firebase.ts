import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getStorage } from '@firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDNQybeR-7zmTCjaUIJUFJBzLBy_8enGJM',
  authDomain: 'd100-7cb14.firebaseapp.com',
  projectId: 'd100-7cb14',
  storageBucket: 'd100-7cb14.firebasestorage.app',
  messagingSenderId: '4289428408',
  appId: '1:4289428408:web:20660ae963b4d4790e6d4d',
  measurementId: 'G-01C1C9G01B',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const auth = getAuth();
export const storage = getStorage(app);
export default db;
