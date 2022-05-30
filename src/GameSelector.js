import { useState } from "react";
import { Blackjack } from "./Blackjack";
import { MultiplayerSystem } from "./MultiplayerSystem";

export const GameSelector = () => {

  const [chosenGame, setChosenGame] = useState('blackjackSolo');
  const onChooseGame = e => setChosenGame(e.target.value);
  const game = (chosenGame === 'blackjackSolo') ? <Blackjack /> : <MultiplayerSystem />;

  return (
    <div>
      <h1 className="text-5xl font-bold">Play Blackjack</h1>
      <div className="form-control flex flex-row">
        <label className="label cursor-pointer">
          <span className="label-text">Solo</span>
          <input type="radio" name="blackjack" value="blackjackSolo" className="radio"
            onChange={onChooseGame}
            checked={chosenGame === 'blackjackSolo'} />
        </label>
        <label className="label cursor-pointer">
          <span className="label-text">Multiplayer</span>
          <input type="radio" name="blackjack" value="blackjackMulti" className="radio"
            onChange={onChooseGame}
            checked={chosenGame === 'blackjackMulti'} />
        </label>
      </div>
      {game}
    </div>
  );
};