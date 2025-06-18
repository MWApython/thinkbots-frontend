import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCfPeYJPV8n2ELnlU7S3tAUnDADIKauAik',
  authDomain: 'thinkbots-31319.firebaseapp.com',
  projectId: 'thinkbots-31319',
  storageBucket: 'thinkbots-31319.firebasestorage.app',
  messagingSenderId: '525236152451',
  appId: '1:525236152451:web:d8c8cb86d18ca5790793b6',
  measurementId: 'G-BM54755PKB'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };