
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4W88Pk8mAdWm_gQ-CkrDSQc3EcZ7aI3E",
  authDomain: "fir-upload-c5188.firebaseapp.com",
  projectId: "fir-upload-c5188",
  storageBucket: "fir-upload-c5188.appspot.com",
  messagingSenderId: "532934057785",
  appId: "1:532934057785:android:6d014fb2505efec48f92e8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
