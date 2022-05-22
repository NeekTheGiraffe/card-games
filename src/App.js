import './App.css';
import { firebaseConfig } from './firebaseConfig.js';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

import { useAuthState } from 'react-firebase-hooks/auth';

import { Blackjack } from './Blackjack';
import { UserProfile } from './UserProfile';
import { ChatRoom } from './ChatRoom';

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

function App() {

  // Will be an object if user is signed in, null if not
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <Blackjack db={db} auth={auth}/>
      
      {user && <UserProfile db={db} uid={user.uid}/>}

      <h1>Chat</h1>
      <SignOut />

      <section>
        {user ? <ChatRoom db={db} auth={auth}/> : <SignIn />}
      </section>
    </div>
  );
}

// If a user profile doesn't exist, then create one
const createUserProfile = async (uid) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef); // document snapshot

  if (!docSnap.exists())
  {
    await setDoc(docRef, {
      blackjackRecord: { wins: 0, losses: 0, ties: 0 }
    });

    return "Hello! Created user profile.";
  }
  return "Welcome back!";
}

function SignIn()
{
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(res => createUserProfile(res.user.uid)) // Create a new profile for the person logging on, if they don't have one yet
      .then(res => console.log(res))
      .catch(error => console.error(error.messsage));
  }

  return (
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  );
}

function SignOut() {
  return auth.currentUser && (

    <button onClick={() => signOut(auth)}>Sign Out</button>
  );
}

export default App;
