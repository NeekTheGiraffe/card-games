import './app.css';
import { firebaseConfig } from './firebaseConfig.js';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref } from 'firebase/database';

import { useAuthState } from 'react-firebase-hooks/auth';

import { Blackjack } from './Blackjack';
import { UserProfile, createUserProfile } from './UserProfile';
import { ChatRoom } from './ChatRoom';
import { Lobby, createLobby, LobbyTable } from './Lobby';
import { useObjectVal } from 'react-firebase-hooks/database';
import { UserSearch } from './UserSearch';
import { GameSelector } from './GameSelector';

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getDatabase(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">

      <GameSelector />
      
      {user && <UserProfile uid={user.uid}/>}

      <UserSearch />

      <h1>Chat</h1>
      <SignOut />
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
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
    <button className="btn" onClick={signInWithGoogle}>Sign in with Google</button>
  );
}

function SignOut() {
  return auth.currentUser && (

    <button className="btn" onClick={() => signOut(auth)}>Sign Out</button>
  );
}

export default App;
