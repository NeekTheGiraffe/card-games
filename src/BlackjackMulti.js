import { ref, runTransaction } from "firebase/database"
import { useAuthState } from "react-firebase-hooks/auth";
import { useObjectVal } from "react-firebase-hooks/database";
import { auth, db } from "./App";
import { BlackjackHand, CardDeck } from "./BlackjackComponents";
import { blackjackSum, dealOne, freshDeck,
  isBlackjack, playable, shuffle, dealerPlayable } from "./cards";

// Requires props of lobby (object) and lobbyId (string)
// TODO: Stop the entire component from re-rendering after an action is taken (fixed?)
export const BlackjackMulti = props => {

  const [table] = useObjectVal(ref(db, `games/blackjackMulti/${props.lobbyId}/table`));
  const [user] = useAuthState(auth);
  const {lobby} = props;
  //const [lobby] = useObjectVal(ref(db, `lobbies/${props.lobbyId}`));

  //console.log('re-render');
  //if (table == null) console.log('nasty');
  //if (lobby == null) console.log('nasty x2');

  if (!table || !lobby) return null;

  const dealerCards = table.players ? table.players[table.numPlayers] : [];
  const ourIndex = lobby.players.findIndex(player => player.uid === user.uid);
  const isOurTurn = table.whoseTurn === ourIndex;
  let blurb; if (isOurTurn) {
    blurb = 'Your turn';
  } else if (table.whoseTurn === -1) {
    blurb = 'Waiting to deal';
  } else if (table.whoseTurn === table.numPlayers) {
    blurb = 'Waiting for next hand';
  } else {
    blurb = `${lobby.players[table.whoseTurn].displayName}'s turn`;
  }
  const results = table.players ?
    calculateAllWinners(table.players.slice(0, -1), dealerCards, table.whoseTurn === table.numPlayers) :
    Array.from(lobby.numPlayers, () => null);

  return (
    <div>
      <CardDeck className="float-right" size={table.deckLength} />
      <div className="flex flex-col place-items-center">
        <BlackjackHand cards={dealerCards} name="Dealer" top />
        <p className="mb-1">{blurb}</p>
        <BlackjackButtons table={table} deal={() => deal(props.lobbyId)} leaderIdx={lobby.leaderIdx}
          hit={() => hit(props.lobbyId)} stay={() => stay(props.lobbyId)} players={lobby.players}
          nextHand={() => nextHand(props.lobbyId)} endGame={() => endGame(props.lobbyId)}
        />
        <PlayerGroup players={lobby.players} playerHands={table.players} results={results} />
      </div>
    </div>
  );
};

const BlackjackButtons = ({ players, table, hit, stay, nextHand, endGame, deal, leaderIdx }) => {

  const [user] = useAuthState(auth);
  if (!table) return null;
  const ourIndex = players.findIndex(player => player.uid === user.uid);
  if (table.whoseTurn === ourIndex) return (
    <div className="btn-group">
      <button className="btn" onClick={hit}>Hit</button>
      <button className="btn" onClick={stay}>Stay</button>
    </div>
  );
  if (leaderIdx !== ourIndex) return null; // Not our turn but not leader
  // We're the leader
  if (table.whoseTurn === -1) return ( // About to deal cards
    <div className="btn-group">
      <button className="btn" onClick={deal}>Deal</button>
    </div>
  );
  if (table.whoseTurn === table.numPlayers) return ( // Dealer took their turn; game is over
    <div className="btn-group">
      <button className="btn btn-primary" onClick={nextHand}>Next hand</button>
      <button className="btn" onClick={endGame}>End game</button>
    </div>
  );
  return null;
};

const PlayerGroup = ({ players, playerHands, results }) => {

  if (!players) return null;
  if (playerHands == null) playerHands = Array.from(Array(players.length), () => []);
  
  const blackjackHands = players.map((player, i) => 
    <BlackjackHand key={player.uid} cards={playerHands[i]} name={player.displayName} result={results[i]} />);
  return <div className="flex flex-row">{blackjackHands}</div>;
};

// ----------------------------------------------------------------
// TODO: Validate that the player calling these functions is the one that should be doing so.
// TODO: Parametrize numPlayers/lobby size

export const startGame = async (lobbyId) => {
  let success = false;
  let numPlayers = -999;
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    if (lobby.numPlayers !== lobby.capacity) return;
    success = true;
    numPlayers = lobby.numPlayers;
    lobby.lobStatus = 'in-game';
    return lobby;
  });
  if (!success) throw new Error('Lobby is not ready to start game');
  return runTransaction(bjGameRef(lobbyId), game => {
    const gameData = {
      table: { whoseTurn: -1, numPlayers: numPlayers }, // table stores all visible data for UI
      deck: shuffle(freshDeck()) // deck is only read/written when necessary
    };
    gameData.table.deckLength = gameData.deck.length;
    return gameData;
  });
};

export const endGame = async (lobbyId) => {
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    lobby.lobStatus = 'waiting';
    return lobby;
  });
  await destroyGame(lobbyId);
};

// NOTE: Must update the lobby status by yourself.
export const destroyGame = async (lobbyId) => {
  await runTransaction(bjGameRef(lobbyId), game => null);
};

const deal = async (lobbyId) => {
  let incrementArr = null;
  await runTransaction(bjGameRef(lobbyId), game => {
    if (game == null) return 0;
    if (game.table.whoseTurn !== -1) return;
    const cardsPerPlayer = 2;
    if (game.table.deckLength < cardsPerPlayer * (game.table.numPlayers + 1) + 1)
      game.deck = shuffle(freshDeck()).concat(game.deck); // Add a fresh deck to the bottom
    // Deal all cards
    game.table.players = Array.from(Array(game.table.numPlayers + 1), () => []);
    for (let i = 0; i < cardsPerPlayer; i++)
    {
      game.table.players.forEach(player => {
        dealOne(game.deck, player, true);
      });
    }
    // Set the last card dealt to the dealer face-down
    const dealer = game.table.players[game.table.numPlayers];
    dealer[1].faceUp = false;
    game.table.whoseTurn = 0;
    // If the dealer has a natural, the game is over.
    // Everyone who has a natural ties, and everyone who doesn't loses.
    if (isBlackjack(dealer)) {
      game.table.whoseTurn = game.table.numPlayers;
      finishDealersTurn(dealer);
      incrementArr = calculateIncrements(game);
    }
    // Else, if the first player has a natural, will need to move on.
    else if (isBlackjack(game.table.players[0]))
    {
      if (nextPlayer(game)) incrementArr = calculateIncrements(game);
    }
    game.table.deckLength = game.deck.length;
    return game;
  });

  // If should update stats, update them
  if (incrementArr)
  {
    const incrementMap = await incrementArrayToMap(incrementArr, lobbyId);
    handleGameOver(lobbyId, incrementMap);
  }
};

const hit = async (lobbyId) => {
  let incrementArr = null;
  await runTransaction(bjGameRef(lobbyId), game => {
    if (game == null) return 0;
    if (game.table.whoseTurn < 0 || game.table.whoseTurn >= game.table.numPlayers) return;
    // Deal one card
    dealOne(game.deck, game.table.players[game.table.whoseTurn], true);
    if (game.deck.length === 0) game.deck = shuffle(freshDeck());
    // If the current player is done, then move on
    const bjSum = blackjackSum(game.table.players[game.table.whoseTurn])
    if (!playable(bjSum))
    {
      if (nextPlayer(game)) {
        incrementArr = calculateIncrements(game);
      }
    }
    game.table.deckLength = game.deck.length;
    return game;
  });

  // If should update stats, update them
  if (incrementArr)
  {
    const incrementMap = await incrementArrayToMap(incrementArr, lobbyId);
    handleGameOver(lobbyId, incrementMap);
  }
};

const stay = async (lobbyId) => {
  let incrementArr = null;
  await runTransaction(bjGameRef(lobbyId), game => {
    if (game == null) return 0;
    if (game.table.whoseTurn < 0 || game.table.whoseTurn >= game.table.numPlayers) return;
    if (nextPlayer(game)) incrementArr = calculateIncrements(game);
    game.table.deckLength = game.deck.length;

    return game;
  });

  // If should update stats, update them
  if (incrementArr)
  {
    const incrementMap = await incrementArrayToMap(incrementArr, lobbyId);
    handleGameOver(lobbyId, incrementMap);
  }
};

const nextHand = async (lobbyId) => {
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    lobby.lobStatus = 'in-game';
    return lobby;
  });
  return runTransaction(bjGameRef(lobbyId), game => {
    if (game == null) return 0;
    // Clear the hands of all players
    game.table.players = {};
    game.table.whoseTurn = -1;
    return game;
  });
};

// increments should be an object that maps uids to one of 'wins', 'losses', or 'ties'
const handleGameOver = async (lobbyId, increments) => {
  await runTransaction(ref(db, `stats/blackjackMulti`), stats => {
    if (!stats) stats = {};
    Object.keys(increments).forEach(key => {
      if (!stats[key]) {
        stats[key] = { wins: 0, losses: 0, ties: 0 };
      }
      stats[key][increments[key]]++;
    });
    return stats;
  });
  return runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    lobby.lobStatus = 'between hands';
    return lobby;
  });
};

const incrementArrayToMap = async (arr, lobbyId) => {
  const incrementMap = {};
  await runTransaction(ref(db, `lobbies/${lobbyId}`), lobby => {
    arr.forEach((incr, i) => incrementMap[lobby.players[i].uid] = incr);
  });
  return incrementMap;
};

// ----- The following functions are synchronous and don't involve the database. -----
// TODO: Merge this with BlackjackSolo.js to reduce code duplication
const calculateIncrements = (game) => {
  const increments = [];
  const incrementsMap = { 'Player!': 'wins', 'Dealer!': 'losses', 'Tie!': 'ties' };
  // Calculate winner for every player (except dealer)
  const dealer = game.table.players[game.table.numPlayers];
  game.table.players.slice(0, -1).forEach(player => {
    increments.push(incrementsMap[calculateWinner(player, dealer)]);
  });
  return increments;
};

// TODO: Migrate to cards.js
const calculateWinner = (player, dealer) =>
{
  let pSum = blackjackSum(player);
  let dSum = blackjackSum(dealer);
  if (dSum === 'Blackjack!')
  {
    if (pSum === 'Blackjack!') return 'Tie!';
    return 'Dealer!';
  }
  if (pSum === 'Blackjack!') return 'Player!';
  if (pSum === 'Bust!') return 'Dealer!';
  if (dSum === 'Bust!') return 'Player!';
  if (pSum > dSum) return 'Player!';
  if (dSum > pSum) return 'Dealer!';
  return 'Tie!';
}

const calculateAllWinners = (players, dealer, allDone) => {
  const dSum = blackjackSum(dealer);
  if (dSum === 'Blackjack!') {
    return players.map(player => blackjackSum(player) === 'Blackjack!' ? 'tie' : 'loss');
  }
  return players.map(player => {
    const pSum = blackjackSum(player);
    if (pSum === 'Blackjack!') return 'win';
    if (pSum === 'Bust!') return 'loss';
    if (!allDone) return null;
    if (dSum === 'Bust!') return 'win';
    if (pSum > dSum) return 'win';
    if (dSum > pSum) return 'loss';
    return 'tie';
  });
} 

const dealersTurn = (dealer, deck) => {
  while (dealerPlayable(blackjackSum(dealer)))
  {
    dealOne(deck, dealer, true);
    if (deck.length === 0) deck.push(...shuffle(freshDeck()));
  }
  finishDealersTurn(dealer);
};

const finishDealersTurn = dealer => {
  dealer[1].faceUp = true;
};

// Return true if this game is over and the dealer took their turn, false otherwise.
const nextPlayer = game => {
  //console.log('Inside nextplayer');
  do {
    game.table.whoseTurn++; // Go to the next player, and skip everyone who has a blackjack
    //console.log('Incremented');
  } while (game.table.whoseTurn !== game.table.numPlayers && !playable(blackjackSum(game.table.players[game.table.whoseTurn])));
  
  //console.log(`Broken out of loop with whoseTurn=${game.table.whoseTurn}`);
  if (game.table.whoseTurn !== game.table.numPlayers) return false;

  // If it's the dealer's turn, do their turn.
  let everyoneElseBusted = true;
  game.table.players.slice(0, -1).forEach(player => { if (blackjackSum(player) !== 'Bust!') everyoneElseBusted = false; });
  if (!everyoneElseBusted) dealersTurn(game.table.players[game.table.whoseTurn], game.deck);
  return true;
};

const bjGameRef = lobbyId => ref(db, `games/blackjackMulti/${lobbyId}`);