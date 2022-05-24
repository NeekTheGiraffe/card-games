import './App.css';
import { firebaseConfig } from './firebaseConfig.js';

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase, ref, get, set, child } from 'firebase/database';

import { useAuthState } from 'react-firebase-hooks/auth';

import { Blackjack } from './Blackjack';
import { UserProfile } from './UserProfile';
import { ChatRoom } from './ChatRoom';
import { Lobby, createLobby, LobbyListing } from './Lobby';
import { useObjectVal } from 'react-firebase-hooks/database';

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase(app);

function App() {

  // Will be an object if user is signed in, null if not
  const [user] = useAuthState(auth);
  const userInfoRef = user && ref(db, `users/${user.uid}`);
  const [userInfo] = useObjectVal(userInfoRef);
  const lobbyId = userInfo && userInfo.lobbyId;

  const lobbiesRef = !lobbyId && ref(db, 'lobbies');
  const [lobbies] = useObjectVal(lobbiesRef);

  return (
    <div className="App">

      {lobbies && Object.keys(lobbies).map(lobbyId => <LobbyListing key={lobbyId} db={db} auth={auth} lobbyId={lobbyId} />)}
      {!lobbyId && <button onClick={() => createLobby(db, user.uid)}>Create lobby</button>}
      {lobbyId && user && <Lobby db={db} lobbyId={lobbyId} uid={user.uid}/>}
    
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

const defaultProfile = {
  displayName: 'Cowboy',
  profilePicture: 'snake'
};

// If a user profile doesn't exist, then create one
const createUserProfile = async (uid) => {
  console.log(`users/${uid}`);

  const profileSnap = await get(child(ref(db), `users/${uid}`));

  if (!profileSnap.exists())
  {
    const profileRef = ref(db, `users/${uid}`);
    await set(profileRef, defaultProfile);
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
