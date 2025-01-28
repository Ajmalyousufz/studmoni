// Import required Firebase modules
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import { getFirestore} from 'firebase/firestore'
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZoPE5anTtTEkd0d-8wBgOzTwF0qCju7g",
  authDomain: "studmoni-8ef13.firebaseapp.com",
  projectId: "studmoni-8ef13",
  storageBucket: "studmoni-8ef13.firebasestorage.app",
  messagingSenderId: "992360789825",
  appId: "1:992360789825:web:9471f72d74f4d8f2b9d3c0",
  measurementId: "G-Y7Q7NDY9RE"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export {auth,db,storage}
