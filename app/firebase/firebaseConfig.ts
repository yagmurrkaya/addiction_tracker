// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC52gKdsJlIbXN3RpeHgCFYQmRIVAX-13o",
  authDomain: "addictiontracker-aba95.firebaseapp.com",
  projectId: "addictiontracker-aba95",
  storageBucket: "addictiontracker-aba95.firebasestorage.app",
  messagingSenderId: "980460748209",
  appId: "1:980460748209:web:f873bde3ec3c867b62d190",
  measurementId: "G-R7VWD59P3V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { app, db };

