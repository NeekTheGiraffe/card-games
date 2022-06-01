import { get, push, ref, runTransaction } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { useObjectVal } from "react-firebase-hooks/database";
import { db, auth } from "./App";
import { startGame, destroyGame, BlackjackMulti } from "./BlackjackMulti";
import { UserListing } from "./UserProfile";

export const Lobby = props => {

  const [lobby] = useObjectVal(ref(db, `lobbies/${props.lobbyId}`));
  const [user] = useAuthState(auth);
  if(lobby === null) console.log('eww');

  if (!lobby) return null;
  
  const { numPlayers, capacity, players, game, leaderIdx, lobStatus } = lobby;

  // Buttons that may or may not show up
  const isInGame = lobStatus === 'in-game';
  const betweenHands = lobStatus === 'between hands';
  const isLeader = leaderIdx === players.findIndex(player => player.uid === user.uid);
  const readyToStart = !(isInGame || betweenHands) && numPlayers === capacity && isLeader;
  const startGameButton = readyToStart ? <button className="btn btn-primary" onClick={() => startGame(props.lobbyId)}>Start game</button> : null;
  const leaveButton = !isInGame ? <button className="btn" onClick={() => leaveLobby(props.lobbyId, user.uid)}>Leave lobby</button> : null;
  const gameComp = (isInGame || betweenHands) ? <BlackjackMulti lobbyId={props.lobbyId} lobby={lobby} /> : null;

  const mayChangeLobSize = !isInGame && !betweenHands && isLeader;
  return (
    <div className="mt-2">
      <div>
        <div className="float-right btn-group">
          {startGameButton}
          {leaveButton}
        </div>
        <CapacityHandler numPlayers={numPlayers} capacity={capacity}
          permission={mayChangeLobSize}
          onShrink={() => shrinkLobby(props.lobbyId)}
          onGrow={() => expandLobby(props.lobbyId)} />
        <PlayerList players={players} leaderIdx={leaderIdx} />
        
      </div>
      {gameComp}
    </div>
  );
};

const CapacityHandler = props => {
  const mayShrink = (props.capacity > props.numPlayers) ? null : "disabled";
  const mayGrow = (props.capacity < MAX_LOBBY_SIZE) ? null : "disabled";
  return (
    <div className="btn-group">
      {props.permission && <button className="btn" onClick={props.onShrink} disabled={mayShrink}>-</button>}
      <button className="btn no-animation bg-base-200 hover:bg-base-200">{props.numPlayers}/{props.capacity} players</button>
      {props.permission && <button className="btn" onClick={props.onGrow} disabled={mayGrow}>+</button>}
    </div>
  );
};
const PlayerList = props => {
  if (!props.players) return null;
  return props.players.map((player, index) => 
    <UserListing key={player.uid} profilePicture={player.profilePicture}
      displayName={player.displayName} leader={index === props.leaderIdx} />
  );
};

export const LobbyTable = props => {
  
  const [lobbies] = useObjectVal(ref(db, 'lobbies'));
  const listings = lobbies && Object.keys(lobbies).map(lobbyId =>
    <LobbyListing key={lobbyId} lobbyId={lobbyId} lobbyData={lobbies[lobbyId]} />);

  return (
    <div className="w-full">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Leader</th>
            <th>Game</th>
            <th>Players</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {listings}
        </tbody>
      </table>
    </div>
  );
};

export const LobbyListing = ({ lobbyId, lobbyData }) => {
  
  const { numPlayers, capacity, game, leaderIdx, players } = lobbyData;
  const [user] = useAuthState(auth);

  return (
    <tr>
      <td>{players[leaderIdx].displayName}</td>
      <td>{game}</td>
      <td>{numPlayers}/{capacity}</td>
      <td>
        <button className="btn" onClick={() => joinLobby(user.uid, lobbyId)}>Join</button>
      </td>
    </tr>
  );
};

const MAX_LOBBY_SIZE = 4;

export const createLobby = async (leaderUid) => {
  const leaderRef = ref(db, `users/${leaderUid}`);
  const leaderSnap = await get(leaderRef);
  const { displayName, profilePicture } = leaderSnap.val();
  const lobbyData = {
    numPlayers: 1,
    capacity: 2,
    game: 'blackjack',
    leaderIdx: 0,
    players: [{ uid: leaderUid, displayName, profilePicture }],
    lobStatus: 'waiting'
  };
  const lobbyRef = await push(ref(db, 'lobbies'), lobbyData);
  await runTransaction(leaderRef, user => {
    user.lobbyId = lobbyRef.key;
    return user;
  });
  return lobbyRef;
};

export const expandLobby = async (lobbyId, sizeChange = 1) => {
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    if (lobby.lobStatus !== 'waiting') return;
    if (lobby.capacity + sizeChange > MAX_LOBBY_SIZE)
      lobby.capacity = MAX_LOBBY_SIZE;
    else
      lobby.capacity += sizeChange;
    return lobby;
  });
};

export const shrinkLobby = async (lobbyId, sizeChange = 1) => {
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    if (lobby.lobStatus !== 'waiting') return;
    if (lobby.capacity - sizeChange < lobby.numPlayers)
      lobby.capacity = lobby.numPlayers;
    else
      lobby.capacity -= sizeChange;
    return lobby;
  });
}

export const leaveLobby = async (lobbyId, uid) => {
  let success = false;
  let shouldDeleteGame = false;
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    if (!lobby) return 0;
    if (lobby.lobStatus === 'in-game') return;
    success = true;
    // If we were between hands in the middle of a game, end the game
    if (lobby.lobStatus === 'between hands') { lobby.lobStatus = 'waiting'; shouldDeleteGame = true; }
    // Decrement the player count
    lobby.numPlayers--;
    // If now empty, can just delete the lobby
    if (lobby.numPlayers === 0) return {};
    // Remove uid from lobby
    lobby.players = lobby.players.filter(player => player.uid !== uid);
    // If leader, must pass off to someone else
    if (lobby.players[lobby.leaderIdx].uid === uid) lobby.leaderId = 0;
    return lobby;
  });
  if (!success) throw new Error('Cannot leave a lobby that is in-game');
  if (shouldDeleteGame) await destroyGame(lobbyId);
  await runTransaction(ref(db, `users/${uid}`), user => {
    user.lobbyId = null;
    return user;
  });
};

export const joinLobby = async (uid, lobbyId) => {
  const userRef = ref(db, `users/${uid}`);
  const userSnap = await get(userRef);
  const { displayName, profilePicture } = userSnap.val();
  let errMsg = '';
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    if (lobby.numPlayers >= lobby.capacity) { errMsg = 'Lobby is full'; return; } // Lobby is full, abort
    if (lobby.lobStatus === 'in-game') { errMsg = 'Lobby is already in-game'; return; }
    lobby.players.push({ uid, displayName, profilePicture });
    lobby.numPlayers++;
    return lobby;
  });
  if (errMsg) throw new Error(errMsg);
  await runTransaction(userRef, user => {
    user.lobbyId = lobbyId;
    return user;
  });
};