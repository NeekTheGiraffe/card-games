import { useRef, useState } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';

export const ChatRoom = props =>
{
  const dummy = useRef();

  const messagesRef = collection(props.db, 'messages').withConverter(messageConverter);
  const q = query(messagesRef, orderBy('createdAt'));
  const [messages] = useCollectionData(q);

  const [formValue, setFormValue] = useState('');

  const sendMessage = async(e) => {

    e.preventDefault(); // Prevent the page from being refreshed
    const { uid, photoURL } = props.auth.currentUser;
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
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} auth={props.auth} />)}

        <div ref={dummy}></div>
      </div>

      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={e => setFormValue(e.target.value)}/>

        <button type="submit">🕊️</button>

      </form>
    </div>
  );
}

const ChatMessage = props =>
{
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === props.auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} alt="Person"/>
      <p>{text}</p>
    </div>
  );
}

const messageConverter = {
  toFirestore: msg => { return { text: msg.text, createdAt: msg.createdAt, uid: msg.uid, photoURL: msg.photoURL }; }, // Unused
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id
    };
  }
};