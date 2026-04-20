
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "passnote-55fa3.firebaseapp.com",
  projectId: "passnote-55fa3",
  storageBucket: "passnote-55fa3.firebasestorage.app",
  messagingSenderId: "872524629708",
  appId: "1:872524629708:web:06f5e8d8779b552cb0e469"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}