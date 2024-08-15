import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getStorage } from '@firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBbuUCNnbzvB-rLv582GLrKkeZEcmUB8k8',
  authDomain: 'dnd-threads.firebaseapp.com',
  projectId: 'dnd-threads',
  storageBucket: 'dnd-threads.appspot.com',
  messagingSenderId: '232498748196',
  appId: '1:232498748196:web:ea78597641d6af1a2c71b1',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const auth = getAuth();
export const storage = getStorage(app);
export default db;
