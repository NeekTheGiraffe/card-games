import { ref, runTransaction } from "firebase/database"
import { useObjectVal } from "react-firebase-hooks/database";
import { auth, db } from "./App";
import { mapCardArrayToComponents } from "./Card";
import { blackjackSum, blackjackSumHidden, dealOne, freshDeck,
  isBlackjack, playable, shuffle, dealerPlayable } from "./cards";

// Requires props of lobby (object) and lobbyId (string)
// TODO: Stop the entire component from re-rendering after an action is taken (fixed?)
export const BlackjackMulti = props => {

  const [table] = useObjectVal(ref(db, `games/blackjackMulti/${props.lobbyId}/table`));
  if (!table) return null;
  let players;
  if (table.players) {
    players = table.players.slice(0, -1).map((player, index) => 
      <BlackjackPlayer key={index} cards={player} displayName={props.lobby.players[index].displayName} />
    );
  } else {
    players = props.lobby.players.map((player, i) => <BlackjackPlayer key={i} cards={[]} displayName={player.displayName} />);
  }
  
  const dealerCards = table.players ? table.players[table.numPlayers] : [];

  // TODO: Create a different dealer component with a slightly different layout
  
  const ourIndex = props.lobby.players.findIndex(player => player.uid === auth.currentUser.uid);
  const isOurTurn = table.whoseTurn === ourIndex;
  let buttons = null;
  if (isOurTurn) {
    buttons = (<span>
      <button className="btn" onClick={() => hit(props.lobbyId)}>Hit</button>
      <button className="btn" onClick={() => stay(props.lobbyId)}>Stay</button>
    </span>);
  } else if (props.lobby.leaderIdx === ourIndex) { // We're the leader
    if (table.whoseTurn === -1) { // About to deal cards
      buttons = <button className="btn" onClick={() => deal(props.lobbyId)}>Deal</button>;
    } else if (table.whoseTurn === table.numPlayers) { // Dealer took their turn; game is over
      buttons = (<span>
        <button className="btn" onClick={() => nextHand(props.lobbyId)}>Next hand</button>
        <button className="btn" onClick={() => endGame(props.lobbyId)}>End game</button>
      </span>);
    }
  }
  let blurb;
  if (isOurTurn) {
    blurb = 'Your turn';
  } else if (table.whoseTurn === -1) {
    blurb = 'Waiting to deal';
  } else if (table.whoseTurn === table.numPlayers) {
    blurb = 'Waiting for next hand';
  } else {
    blurb = `${props.lobby.players[table.whoseTurn].displayName}'s turn`;
  }

  return (
    <div>
      {/* Dealer */}
      <p>(Dealer icon goes here)<br/>
      Dealer<br/>
      {mapCardArrayToComponents(dealerCards)}<br/>
      {blackjackSumHidden(dealerCards)}</p>

      <p>Deck: {table.deckLength}</p>
      <p>{blurb}</p>
      {buttons}
      <span>{players}</span>
    </div>
  );
};

export const BlackjackPlayer = props => {
  return (
    <div>
      {/* Cards */}
      <p>{mapCardArrayToComponents(props.cards)}<br/>
      {/* Sum of the cards */}
      {blackjackSum(props.cards)}<br/>
      {/* Player icon */}
      (Icon goes here)<br/>
      {/* Player name. TODO: Add tags like 'leader' or 'you' */}
      {props.displayName}</p>
    </div>
  );
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
    if (game.table.deckLength * cardsPerPlayer < (game.table.numPlayers + 1)) return; // Not enough cards to deal
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
    //console.log('got through it');
    // If the current player is done, then move on
    const bjSum = blackjackSum(game.table.players[game.table.whoseTurn])
    if (!playable(bjSum))
    {
      //console.log(`Not playable; blackjack sum is ${bjSum}`);
      if (nextPlayer(game)) {
        //console.log('nextPlayer returned true');
        incrementArr = calculateIncrements(game);
      }
      //console.log('Almost out of the if');
    }
    //console.log('got through this too');
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
// TODO: Merge this with Blackjack.js to reduce code duplication
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

const dealersTurn = (dealer, deck) => {
  while (dealerPlayable(blackjackSum(dealer)))
  {
    dealOne(deck, dealer, true);
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