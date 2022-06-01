import { useAuthState } from "react-firebase-hooks/auth";
import { useObjectVal } from "react-firebase-hooks/database";
import { auth, db } from "./App";
import { createLobby, Lobby, LobbyTable } from "./Lobby";
import { ref } from "firebase/database";

export const MultiplayerSystem = () => {
  
  const [user] = useAuthState(auth);
  const userInfoRef = user ? ref(db, `users/${user.uid}`) : null;
  const [userInfo] = useObjectVal(userInfoRef);
  
  if (!user) return <p>Sign in to play multiplayer Blackjack!</p>;
  const lobbyId = userInfo && userInfo.lobbyId;
  if (!lobbyId) return (
    <div>
      <button className="btn btn-primary mb-2" onClick={() => createLobby(user.uid)}>Create lobby</button>
      <LobbyTable />
    </div>
  );
  return <Lobby lobbyId={lobbyId} uid={user.uid}/>;
}