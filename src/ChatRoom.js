import { useRef, useState } from 'react';
import { useObjectVal } from 'react-firebase-hooks/database';
import { ref, query, orderByChild, serverTimestamp, push } from 'firebase/database';
import { db, auth } from './App';

export const ChatRoom = props =>
{
  const messagesRef = query(ref(db, 'messages'), orderByChild('createdAt'));
  const [messages] = useObjectVal(messagesRef);

  return (
    <div>
      <div>
        {messages && Object.keys(messages).map(key => <ChatMessage key={key} message={messages[key]} auth={props.auth}/>)}
      </div>

      <ChatForm />
    </div>
  );
}

const ChatForm = props =>
{
  const dummy = useRef();
  const [formValue, setFormValue] = useState('');

  const sendMessage = async (event) => {

    event.preventDefault(); // Prevent the page from being refreshed
    const { uid, photoURL } = auth.currentUser;
    const messageData = {
      text: formValue,
      createdAt: serverTimestamp(),
      uid: uid,
      photoURL: photoURL
    };
    await push(ref(db, 'messages'), messageData);

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={e => setFormValue(e.target.value)}/>
      <button className="btn" type="submit">🕊️</button>
      <div ref={dummy}></div>
    </form>
  );
}

const ChatMessage = props =>
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