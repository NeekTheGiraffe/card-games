import { ref, runTransaction } from "firebase/database";
import React from "react";
import { blackjackAbsSum, blackjackSum, dealOne, playable, dealerPlayable, isFaceOr10,
  shuffle, freshDeck, cardsToString } from "./cards";
import { db, auth } from "./App";

const defaultRecord = { wins: 0, losses: 0, ties: 0 };

export class Blackjack extends React.Component {

  constructor(props)
  {
    super(props);
    this.state = {
      deck: shuffle(freshDeck()),
      player: [],
      dealer: [],
      hasDealt: false,
      stay: false
    }
  }

  deal()
  {
    let { hasDealt, deck, player, dealer } = this.state;
    if (hasDealt) return;
    if (deck.length < 4) return; // 2 cards needed for player, 2 for dealer
    let newDeck = deck.slice()
    let newPlayer = player.slice();
    let newDealer = dealer.slice();
    dealOne(newDeck, newPlayer, true);
    let dealerFirstCard = dealOne(newDeck, newDealer, true);
    dealOne(newDeck, newPlayer, true);
    dealOne(newDeck, newDealer, false);
    //console.log("Dealt the cards");
    
    // If the dealer's first card is a face or ace, check if it's a natural
    if (dealerFirstCard.rank === 'A' || isFaceOr10(dealerFirstCard.rank))
    {
      //console.log(`Dealer's first card is ${dealerFirstCard.rank}, checking their second card...`);
      if (blackjackAbsSum(newDealer) === 21)
      {
        //console.log("The dealer has a natural!");
        this.finishDealersTurn(newDealer);
      }
      else
      {
        //console.log("The dealer doesn't have a natural.");
      }
    }
    this.handleGameOver(newPlayer, newDealer, false);
    this.setState({ player: newPlayer, deck: newDeck, dealer: newDealer, hasDealt: true });
  }

  hit()
  {
    const { player, deck, dealer, stay } = this.state;
    let di = deck.length - 1;
    let newPlayer = player.concat(deck[di]);
    let newDeck = deck.slice(0, -1);
    let newDealer = dealer.slice();
    let sum = blackjackSum(newPlayer);
    if (sum !== 'Bust!' && !playable(sum))
      this.dealersTurn(newDealer, newDeck);
    this.handleGameOver(newPlayer, newDealer, stay);
    this.setState({ player: newPlayer, deck: newDeck, dealer: newDealer });
  }

  stay()
  {
    const { player, dealer, deck } = this.state;
    let newDealer = dealer.slice();
    let newDeck = deck.slice();
    this.dealersTurn(newDealer, newDeck);
    this.handleGameOver(player, newDealer, true);
    this.setState({ dealer: newDealer, deck: newDeck, stay: true });
  }

  nextHand()
  {
    // Throw away each player's cards, but keep the deck the same
    this.setState({
      player: [],
      dealer: [],
      hasDealt: false,
      stay: false
    });
  }

  dealersTurn(dealer, deck)
  {
    while (dealerPlayable(blackjackSum(dealer)))
    {
      dealOne(deck, dealer, true);
    }
    this.finishDealersTurn(dealer);
  }

  finishDealersTurn(dealer)
  {
    dealer[1].faceUp = true;
  }

  calculateWinner(player, dealer)
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

  gameIsOver(player, dealer, stay)
  {
    if (blackjackSum(dealer) === 'Blackjack!') return true;
    else if (playable(blackjackSum(player)) && !stay) return false;
    else return true;
  }

  incrementOnServer(result)
  {
    const user = auth.currentUser;
    if (!user) return; // No one is signed in
    const recordRef = ref(db, `stats/blackjackSolo/${user.uid}`);
    // Use a transaction as an atomic increment
    runTransaction(recordRef, record => {
      if (!record) record = defaultRecord;
      record[result]++;
      return record;
    })
      .then(res => console.log(`Successfully updated record`))
      .catch(err => console.error(err.message));
  }

  handleGameOver(player, dealer, stay)
  {
    if (!this.gameIsOver(player, dealer, stay)) return; // Game isn't over; no need to update database
    const winner = this.calculateWinner(player, dealer);
    const winnerMap = { 'Player!': 'wins', 'Dealer!': 'losses', 'Tie!': 'ties' };
    this.incrementOnServer(winnerMap[winner]);
  }

  render()
  {
    let { hasDealt, dealer, deck, player, stay } = this.state;
    let done = this.gameIsOver(player, dealer, stay);
    let dealerSum;
    if (dealer.length === 0) dealerSum = 0;
    else if (dealer[1].faceUp) dealerSum = blackjackSum(dealer);
    else dealerSum = '??';

    return (
      <div className="blackjack">
        <h1>Blackjack</h1>
        <p>Dealer: { dealerSum }<br />{cardsToString(dealer)}</p>
        { done && <p>Winner: { this.calculateWinner(player, dealer) }</p>}
        <p>Deck: {deck.length}</p>
        <span>
          { !hasDealt && <button onClick={() => this.deal()}>Deal</button>}
          { hasDealt && !done && <button onClick={() => this.hit()}>Hit</button>}
          { hasDealt && !done && <button onClick={() => this.stay()}>Stay</button>}
          { done && <button onClick={() => this.nextHand()}>Next hand</button>}
        </span>
        <p>Player: {blackjackSum(player)}<br />{cardsToString(player)}</p>
      </div>
    );
  } 
}