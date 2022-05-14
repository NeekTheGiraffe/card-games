import './App.css';


// Firebase SDK
//import firebase from 'firebase/compat/app';
//import 'firebase/firestore';
//import 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { collection, addDoc, getFirestore, serverTimestamp, orderBy, query, limit } from 'firebase/firestore';

// Hooks
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useRef, useState } from 'react';

const firebaseConfig = {
  apiKey: "AIzaSyD4v9r7gjjOlnxjC7LcGFmUblUNtY-ZYCI",
  authDomain: "card-games-cdfd4.firebaseapp.com",
  projectId: "card-games-cdfd4",
  storageBucket: "card-games-cdfd4.appspot.com",
  messagingSenderId: "858939872015",
  appId: "1:858939872015:web:543b15642bacd03a78e47a",
  measurementId: "G-KJB06V9C8J"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

const messageConverter = {
  toFirestore: msg =>
  {
    return { text: msg.text, createdAt: msg.createdAt, uid: msg.uid, photoURL: msg.photoURL };
  }, // unused
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id
    };
  }
};

function App() {

  // Will be an object if user is signed in, null if not
  const [user] = useAuthState(auth);

  return (
    <div className="App">
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
      .then(res => console.log(res.user))
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

function ChatRoom()
{
  const dummy = useRef();

  const messagesRef = collection(db, 'messages').withConverter(messageConverter);
  const q = query(messagesRef, orderBy('createdAt'));
  const [messages] = useCollectionData(q);

  const [formValue, setFormValue] = useState('');

  const sendMessage = async(e) => {

    e.preventDefault(); // Prevent the page from being refreshed
    const { uid, photoURL } = auth.currentUser;
    await addDoc(messagesRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL
    });

    setFormValue('');

    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  //if (messages) { messages.forEach(msg => console.log(msg)); }

  return (
    <div>
      <div>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}

        <div ref={dummy}></div>
      </div>

      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={e => setFormValue(e.target.value)}/>

        <button type="submit">🕊️</button>

      </form>
    </div>
  );
}

function ChatMessage(props)
{
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} alt="Person"/>
      <p>{text}</p>
    </div>
  );
}

export default App;
