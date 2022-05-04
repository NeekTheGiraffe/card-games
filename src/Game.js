import logo from './logo.svg';
import './Game.css';

function Game() {
  return (
    <div className="Game">
      <header className="Game-header">
        <img src={logo} className="Game-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="Game-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Text
        </a>
      </header>
    </div>
  );
}

export default Game;
