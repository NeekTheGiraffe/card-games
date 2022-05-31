import { get, push, ref, runTransaction } from "firebase/database";
import { useObjectVal } from "react-firebase-hooks/database";
import { db, auth } from "./App";
import { startGame, destroyGame, BlackjackMulti } from "./BlackjackMulti";

export const Lobby = props => {

  const [lobby] = useObjectVal(ref(db, `lobbies/${props.lobbyId}`));
  
  if (!lobby) return null;
  
  const { numPlayers, capacity, players, game, leaderIdx, lobStatus } = lobby;
  let playerList = null;
  if (players) {
    playerList = players.map((player, index) => {
      const text = (leaderIdx === index) ? `${player.displayName} (leader)` : player.displayName;
      return <li key={player.uid}>{text}</li>;
    });
  }
  // Buttons that may or may not show up
  const isInGame = lobStatus === 'in-game';
  const betweenHands = lobStatus === 'between hands';
  const isLeader = leaderIdx === players.findIndex(player => player.uid === auth.currentUser.uid);
  const readyToStart = !(isInGame || betweenHands) && numPlayers === capacity && isLeader;
  const startGameButton = readyToStart ? <button className="btn" onClick={() => startGame(props.lobbyId)}>Start game</button> : null;
  const leaveButton = !isInGame ? <button className="btn" onClick={() => leaveLobby(props.lobbyId, auth.currentUser.uid)}>Leave lobby</button> : null;
  const gameComp = (isInGame || betweenHands) ? <BlackjackMulti lobbyId={props.lobbyId} lobby={lobby} /> : null;

  const mayChangeLobSize = !isInGame && !betweenHands && isLeader;
  return (
    <div>
      <h1>Lobby: {game}</h1>
      <CapacityHandler numPlayers={numPlayers} capacity={capacity}
        permission={mayChangeLobSize}
        onShrink={() => shrinkLobby(props.lobbyId)}
        onGrow={() => expandLobby(props.lobbyId)} />
      <ul>{playerList}</ul>
      {startGameButton}
      {leaveButton}
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
  return (
    <tr>
      <td>{players[leaderIdx].displayName}</td>
      <td>{game}</td>
      <td>{numPlayers}/{capacity}</td>
      <td>
        <button className="btn" onClick={() => joinLobby(auth.currentUser.uid, lobbyId)}>Join</button>
      </td>
    </tr>
  );
};

const MAX_LOBBY_SIZE = 4;

export const createLobby = async (leaderUid) => {
  // TODO: Let capacity and game be parameters
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