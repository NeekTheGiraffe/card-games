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

function App(props) {

  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <SuspenseWithPerf fallback={<p>Loading...</p>}>
        <header>
          <Navbar />
        </header>

        <section>
          {props.request == "home" ? <Home/> : <Profile/>}
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
      <a class="navbar-item" onClick={signInWithGoogle}>Sign in with Google</a>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <a class="navbar-item" onClick={() => auth.signOut()}>Sign Out</a>
  )
}


function Navbar() {
  const [user] = useAuthState(auth);
  return (
    <nav class='navbar has-shadow'>
      <div class='navbar-brand'>
        <a class='navbar-item'>The Card Game Cowboys</a>
      </div>
      <div class='navbar-menu'>
        <div class='navbar-start'></div>
        <div class='navbar-end'>
          <a class="navbar-item">Home</a>
          {user ? <SignOut /> : <SignIn />}
        </div>
      </div>
    </nav>
  );
}

export default App;
