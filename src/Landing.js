import logo from './logo.svg';
import './Landing.css';

function Landing() {
  return (
    <div className="Landing">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
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

export default Landing;
