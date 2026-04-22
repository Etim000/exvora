import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDtYtCMXEoWN_C-NJ_Z_YttS144yHyWJA",
  authDomain: "exvora-30e79.firebaseapp.com",
  projectId: "exvora-30e79",
  storageBucket: "exvora-30e79.firebasestorage.app",
  messagingSenderId: "1017066166329",
  appId: "1:1017066166329:web:61e8a9edb0934dded915e8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
