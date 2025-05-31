import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBKvjMYIUkbpFW-y12JmW72i03jdXSBUmQ",
  authDomain: "paises-9a427.firebaseapp.com",
  projectId: "paises-9a427",
  storageBucket: "paises-9a427.firebasestorage.app",
  messagingSenderId: "881018269981",
  appId: "1:881018269981:web:ae4307f5f05dd9f1efb1f4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
