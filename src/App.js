import './App.css';
import { firebaseConfig } from './firebaseConfig.js';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

import { useAuthState } from 'react-firebase-hooks/auth';

import { UserProfile, createUserProfile } from './UserProfile';
import { ChatRoom } from './ChatRoom';
import { UserSearch } from './UserSearch';
import { GameSelector } from './GameSelector';

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getDatabase(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="flex w-full p-6">
      <div className="flex flex-col basis-2/3">
        <GameSelector />
        <div className="divider divider-vertical"></div>
        {user && <UserProfile uid={user.uid}/>}

        <UserSearch />
      </div>
      <div className="divider divider-horizontal"></div>
      <div className="flex flex-col basis-1/3 overflow-y-auto">
        
        { user ? <SignOut /> : <SignIn />}
        <div className="divider divider-vertical"></div>
        {user ? <ChatRoom /> : null}
      </div>
    </div>
  );
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
    <button className="btn btn-primary" onClick={signInWithGoogle}>Sign in with Google</button>
  );
}

function SignOut() {
  return auth.currentUser && (

    <button className="btn" onClick={() => signOut(auth)}>Sign Out</button>
  );
}

export default App;
