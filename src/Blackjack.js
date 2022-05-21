import React from "react";
import { blackjackAbsSum, blackjackSum, dealOne, playable, dealerPlayable, isFaceOr10,
  shuffle, freshDeck, cardsToString } from "./cards";

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
    console.log("Dealt the cards");
    
    // If the dealer's first card is a face or ace, check if it's a natural
    if (dealerFirstCard.rank === 'A' || isFaceOr10(dealerFirstCard.rank))
    {
      console.log(`Dealer's first card is ${dealerFirstCard.rank}, checking their second card...`);
      if (blackjackAbsSum(newDealer) === 21)
      {
        console.log("The dealer has a natural!");
        this.finishDealersTurn(newDealer);
      }
      else
      {
        console.log("The dealer doesn't have a natural.");
      }
    }
    this.setState({ player: newPlayer, deck: newDeck, dealer: newDealer, hasDealt: true });
  }

  hit()
  {
    let { player, deck, dealer } = this.state;
    let di = deck.length - 1;
    let newPlayer = player.concat(deck[di]);
    let newDeck = deck.slice(0, -1);
    let newDealer = dealer.slice();
    let sum = blackjackSum(newPlayer);
    if (sum !== 'Bust!' && !playable(sum))
      this.dealersTurn(newDealer, newDeck);
    this.setState({ player: newPlayer, deck: newDeck, dealer: newDealer });
  }

  stay()
  {
    let { dealer, deck } = this.state;
    let newDealer = dealer.slice();
    let newDeck = deck.slice();
    this.dealersTurn(newDealer, newDeck);
    this.setState({ dealer: newDealer, deck: newDeck, stay: true });
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

  render()
  {
    let { hasDealt, dealer, deck, player, stay } = this.state;
    let done;
    if (blackjackSum(dealer) === 'Blackjack!') done = true;
    else if (playable(blackjackSum(player)) && !stay) done = false;
    else done = true;
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