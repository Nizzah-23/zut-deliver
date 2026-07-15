import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAE3yd0dnyKNznnfpOmKnjeP-wWdEkYhxo",
  authDomain: "zut-deliver.firebaseapp.com",
  projectId: "zut-deliver",
  storageBucket: "zut-deliver.firebasestorage.app",
  messagingSenderId: "655737072838",
  appId: "1:655737072838:web:bb7fb8691ba27c5f55bbc7",
  measurementId: "G-DENP4D56JT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);