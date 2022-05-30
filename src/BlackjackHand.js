import { mapCardArrayToComponents } from "./Card";
import { blackjackSumHidden } from "./cards";

export const BlackjackHand = ({ cards, name, result, top = false }) => {

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
      <div className="flex flex-row">{mapCardArrayToComponents(cards)}</div>
      { bjSum !== 0 && <p className="text-xl text-center m-1">{bjSum}{resultBadge}</p> }
      { !top && namePar }
    </div>
  );
};