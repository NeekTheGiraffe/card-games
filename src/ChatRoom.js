import { useRef, useState } from 'react';
import { useObjectVal } from 'react-firebase-hooks/database';
import { ref, query, orderByChild, serverTimestamp, push, get, limitToLast } from 'firebase/database';
import { db, auth } from './App';

export const ChatRoom = props =>
{
  const messagesRef = query(ref(db, 'messages'), orderByChild('createdAt'), limitToLast(12));
  const [messages] = useObjectVal(messagesRef);

  //if (messages == null) console.log('nasty');

  return (
    <div>
      <h1 className="text-3xl text-center font-bold mb-2">Global Chat</h1>
      <div>
        {messages && Object.keys(messages).map(key =>
          <ChatMessage key={key} message={messages[key]}/>)}
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
    const { uid } = auth.currentUser;
    const profileSnap = await get(ref(db, `users/${uid}`));
    const { profilePicture, displayName } = profileSnap.val();
    const messageData = {
      text: formValue,
      createdAt: serverTimestamp(),
      uid: uid,
      profilePicture,
      displayName
    };
    console.log(messageData);
    await push(ref(db, 'messages'), messageData);
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <form onSubmit={sendMessage} className="mt-2">
      <div className="input-group">
        <input className="input input-bordered flex-grow" value={formValue}
          onChange={e => setFormValue(e.target.value)}/>
        <button className="btn" type="submit">Send</button>
      </div>
      <div ref={dummy}></div>
    </form>
  );
}

const ChatMessage = props =>
{
  const { text, displayName, profilePicture } = props.message;

  //const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (
    <div className="break-words w-full inline-block my-1">
      <span className="float-left flex flex-row items-baseline">
        <img className="w-12 h-12 mr-2 self-center rounded-full" src={`./cowboys/${profilePicture}_tiny.png`} alt={profilePicture}/>
      </span>
      <p>
        <span className="font-bold mr-2">{displayName}</span>
        {text}
      </p>
    </div>
  );
}