import { get, push, ref, runTransaction } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";

export const Lobby = props => {

  const [lobby] = useObjectVal(ref(props.db, `lobbies/${props.lobbyId}`));
  let numPlayers, capacity, players, game, playerList, leaderId;
  if (lobby) {
    ({ numPlayers, capacity, players, game, leaderId } = lobby);
  }
  if (players) {
    playerList = players.map(player => {
      const text = (leaderId === player.uid) ? `${player.displayName} (leader)` : player.displayName;
      return <li key={player.uid}>{text}</li>;
    });
  }

  return ( lobby &&
    <div>
      <h1>Lobby: {game}</h1>
      <h2>Players: {numPlayers}/{capacity}</h2>
      <ul>{playerList}</ul>
      <button onClick={() => leaveLobby(props.db, props.lobbyId, props.uid)}>Leave lobby</button>
    </div>
  );
};

export const LobbyListing = ({ db, lobbyId, auth }) => {
  
  return (
    <div>
      <span>
        Lobby {lobbyId}
        <button onClick={() => joinLobby(db, auth.currentUser.uid, lobbyId)}>Join</button>
      </span>
    </div>
  );
};

export const createLobby = async (db, leaderUid) => {
  // TODO: Let capacity and game be parameters
  const leaderRef = ref(db, `users/${leaderUid}`);
  const leaderSnap = await get(leaderRef);
  const { displayName, profilePicture } = leaderSnap.val();
  const lobbyData = {
    numPlayers: 1,
    capacity: 3,
    game: 'blackjack',
    leaderId: leaderUid,
    players: [{ uid: leaderUid, displayName, profilePicture }]
  };
  console.log(lobbyData);
  const lobbyRef = await push(ref(db, 'lobbies'), lobbyData);
  await runTransaction(leaderRef, user => {
    user.lobbyId = lobbyRef.key;
    return user;
  });
  return lobbyRef;
};

export const leaveLobby = async (db, lobbyId, uid) => {
  await runTransaction(ref(db, `users/${uid}`), user =>{
    user.lobbyId = null;
    return user;
  });
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    if (!lobby) return 0;
    // Decrement the player count
    lobby.numPlayers--;
    // If now empty, can just delete the lobby
    if (lobby.numPlayers === 0) return {};
    // Remove uid from lobby
    lobby.players = lobby.players.filter(player => player.uid !== uid);
    // If leader, must pass off to someone else
    if (lobby.leaderId === uid) lobby.leaderId = lobby.players[0].uid;
    return lobby;
  });
};

export const joinLobby = async (db, uid, lobbyId) => {
  const userRef = ref(db, `users/${uid}`);
  const userSnap = await get(userRef);
  const { displayName, profilePicture } = userSnap.val();
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    if (lobby.numPlayers >= lobby.capacity) return; // Lobby is full, abort
    //console.log(lobby);
    lobby.players.push({ uid, displayName, profilePicture });
    lobby.numPlayers++;
    return lobby;
  }, (error, committed, snapshot) => {
    // If aborted, then throw an error
    if (error) throw new Error('Could not join lobby');
    else if (!committed) throw new Error('Lobby is full!');
  });
  await runTransaction(userRef, user => {
    user.lobbyId = lobbyId;
    return user;
  });
};