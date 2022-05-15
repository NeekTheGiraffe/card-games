import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyC4AHzhZgQfeBd9Nt2ZlzkuWBoEsJuy28U",
    authDomain: "card-games-f326f.firebaseapp.com",
    projectId: "card-games-f326f",
    storageBucket: "card-games-f326f.appspot.com",
    messagingSenderId: "425180528217",
    appId: "1:425180528217:web:a63236d19213afd9df3b48",
    measurementId: "G-74W2Z4T1KC"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app);