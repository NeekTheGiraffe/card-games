import PlayingCard, { mapCardArrayToComponents } from "./Card";
import { blackjackSumHidden } from "./cards";

export const CardDeck = ({ size, className = null }) => (
  <div className={className}>
    <p className="small text-center m-1">Deck
      <span className="badge m-1">{size}</span>
    </p>
    <PlayingCard back />
  </div>
);

export const BlackjackHand = ({ cards, name, result, top = false, profilePicture = null }) => {

  //console.log(`re-rendering hand of ${name}`);

  const bjSum = blackjackSumHidden(cards);
  const namePar = <p className="text-center m-1">{name}</p>;
  let resultBadgeClass = null, resultText = '';
  if (result === 'win') {
    resultBadgeClass = 'badge-success'; resultText = 'W';
  } else if (result === 'loss') {
    resultBadgeClass = 'badge-error'; resultText = 'L';
  } else if (result === 'tie') {
    resultBadgeClass = 'badge-warning'; resultText = 'T';
  }
  const resultBadge = (resultBadgeClass != null) ? <span className={`badge m-1 ${resultBadgeClass}`}>{resultText}</span> : null;
  return (
    <div className="m-2">
      { top && namePar }
      <div className="flex flex-row flex-wrap">{mapCardArrayToComponents(cards)}</div>
      { bjSum !== 0 && <p className="text-xl text-center m-1">{bjSum}{resultBadge}</p> }
      { !top && namePar }
    </div>
  );
};