import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// New Firebase configuration for TaskNest
const firebaseConfig = {
  apiKey: "AIzaSyCWRoryg1l_4klXmpyp9iWrqgq1Pi1Jh24",
  authDomain: "tasknest-29b9c.firebaseapp.com",
  databaseURL: "https://tasknest-29b9c-default-rtdb.firebaseio.com",
  projectId: "tasknest-29b9c",
  storageBucket: "tasknest-29b9c.firebasestorage.app",
  messagingSenderId: "602853619141",
  appId: "1:602853619141:web:4ddfcffa5696dcc2a887ac",
  measurementId: "G-PHLRTP64ET"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

console.log(" Firebase initialized successfully with TaskNest project:", firebaseConfig.projectId);

export { auth, db, storage, analytics };

