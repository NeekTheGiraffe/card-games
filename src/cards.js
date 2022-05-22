export const SUITS = ['♦', '♣', '♥', '♠'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const VALUE_MAP = {
  'A': 11, '2': 2,  '3':  3, '4':  4, '5':  5, '6':  6, '7': 7,
  '8': 8,  '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};
export const FACES = ['J', 'Q', 'K'];
export const FACES_AND_10 = ['10', 'J', 'Q', 'K'];

export const freshDeck = () => {
  return SUITS.flatMap(suit => {
    return RANKS.map(value => { return { suit: suit, rank: value, faceUp: true }; });
  });
};

export const shuffle = deck => {
  let target = deck.length;
  
  while (target > 0)
  {
    let rand = Math.floor(Math.random() * target);
    target--;

    let temp = deck[target];
    deck[target] = deck[rand];
    deck[rand] = temp;
  }
  
  return deck;
};

export const isFaceOr10 = rank => { return FACES_AND_10.includes(rank); }

export const blackjackAbsSum = cards =>
{
  let sum = 0;
  let numAces = 0;
  cards.forEach(card => {
    sum += VALUE_MAP[card.rank];
    if (card.rank === 'A') { numAces++; }
  });
  while (sum > 21 && numAces > 0) { sum -= 10; numAces--; }
  return sum;
};

export const blackjackSum = cards =>
{
  if (isBlackjack(cards)) return 'Blackjack!';
  let sum = blackjackAbsSum(cards);
  return sum > 21 ? 'Bust!' : sum;
};

export const dealOne = (deck, toWhom, faceUp) =>
{
  let card = deck[deck.length - 1];
  card.faceUp = faceUp;
  toWhom.push(card);
  deck.splice(-1);
  return card;
}

export const playable = blackjackSum => {
  if (blackjackSum === 'Bust!' || blackjackSum === 'Blackjack!') return false;
  return blackjackSum < 21;
}

export const dealerPlayable = blackjackSum => {
  if (blackjackSum === 'Bust!' || blackjackSum === 'Blackjack!') return false;
  return blackjackSum < 17;
}

export const cardsToString = cardArr =>
{
  return cardArr.map(card => card.faceUp ? `${card.rank}${card.suit}` : "??").join(" ");
}

export const isBlackjack = cards =>
{
  if (cards.length !== 2)
    return false;
  let ace = false, face = false;
  for (let c = 0; c < 2; c++)
  {
    if (!ace && cards[c].rank === 'A') ace = true;
    if (!face && isFaceOr10(cards[c].rank)) face = true;
  }
  return ace && face;
}
