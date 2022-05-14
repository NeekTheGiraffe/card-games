import 'bulma/css/bulma.css'
import './App.css';
//for css styling

import React, { useRef, useState, Suspense } from 'react';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import Home from './Home.js';
import Profile from './Profile.js';
import { SuspenseWithPerf } from 'reactfire';

firebase.initializeApp({
  apiKey: "AIzaSyC4AHzhZgQfeBd9Nt2ZlzkuWBoEsJuy28U",
  authDomain: "card-games-f326f.firebaseapp.com",
  projectId: "card-games-f326f",
  storageBucket: "card-games-f326f.appspot.com",
  messagingSenderId: "425180528217",
  appId: "1:425180528217:web:a63236d19213afd9df3b48",
  measurementId: "G-74W2Z4T1KC"
})

const auth = firebase.auth();
const firestore = firebase.firestore();
const analytics = firebase.analytics();

function App() {

  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <SuspenseWithPerf fallback={<p>Loading...</p>}>
        <header>
          <Navbar />
        </header>

        <section>
          {user ? <SignOut /> : <SignIn />}
        </section>
      </SuspenseWithPerf>
    </div>
  );
}

function SignIn() {

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}


function Navbar() {
  return (
    <nav class='navbar'>
      <div class='navbar-brand'>
        <a class='navbar-item'>The Card Game Cowboys</a>
      </div>
      <div class='navbar-menu'>
        <div class='navbar-start'></div>
        <div class='navbar-end'>
          <a class="navbar-item">Home</a>
          <a class="navbar-item">Profile Page</a>
        </div>
      </div>
    </nav>
  );
}


export default App;
