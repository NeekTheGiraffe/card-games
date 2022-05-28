import './App.css';
import { firebaseConfig } from './firebaseConfig.js';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref } from 'firebase/database';

import { useAuthState } from 'react-firebase-hooks/auth';

import { Blackjack } from './Blackjack';
import { UserProfile, createUserProfile } from './UserProfile';
import { ChatRoom } from './ChatRoom';
import { Lobby, createLobby, LobbyListing } from './Lobby';
import { useObjectVal } from 'react-firebase-hooks/database';

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getDatabase(app);

function App() {

  // Will be an object if user is signed in, null if not
  const [user] = useAuthState(auth);
  const userInfoRef = user && ref(db, `users/${user.uid}`);
  const [userInfo] = useObjectVal(userInfoRef);
  const lobbyId = userInfo && userInfo.lobbyId;

  const lobbiesRef = user && !lobbyId && ref(db, 'lobbies');
  const [lobbies] = useObjectVal(lobbiesRef);
  const lobbyList = lobbies && Object.keys(lobbies).map(lobbyId => <LobbyListing key={lobbyId} lobbyId={lobbyId} />);

  return (
    <div className="App">

      {lobbyList}
      {!lobbyId && <button onClick={() => createLobby(user.uid)}>Create lobby</button>}
      {lobbyId && user && <Lobby lobbyId={lobbyId} uid={user.uid}/>}
    
      <Blackjack />
      
      {user && <UserProfile uid={user.uid}/>}
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
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  );
}

function SignOut() {
  return auth.currentUser && (

    <button onClick={() => signOut(auth)}>Sign Out</button>
  );
}

export default App;
