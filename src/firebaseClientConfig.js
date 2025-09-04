// Importe as funções dos SDKs que você precisa
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// A configuração do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCNU5ZEl60OcW5eZyL_ZoD0tFKpweQvhwU",
  authDomain: "crmdoceria-9959e.firebaseapp.com",
  projectId: "crmdoceria-9959e",
  // CORREÇÃO APLICADA AQUI
  storageBucket: "crmdoceria-9959e.firebasestorage.app",
  messagingSenderId: "389481198252",
  appId: "1:389481198252:web:429bff3cc5d4f353bea509",
  measurementId: "G-XJ7LPG0229"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Exporte os serviços que você usará na sua aplicação
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

