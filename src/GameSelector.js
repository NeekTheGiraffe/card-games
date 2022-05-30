export const GameSelector = () => {

  return (
    <div>
      <h1 className="text-5xl font-bold">Play Blackjack</h1>
      <div className="form-control flex flex-row">
        <label className="label cursor-pointer">
          <span className="label-text">Solo</span>
          <input type="radio" name="blackjack" className="radio" checked />
        </label>
        <label className="label cursor-pointer">
          <span className="label-text">Multiplayer</span>
          <input type="radio" name="blackjack" className="radio" />
        </label>
      </div>
    </div>
  );
};