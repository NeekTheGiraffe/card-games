import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import MemoryGame from './Memory Game/index.js';
import reportWebVitals from './reportWebVitals';
import {NavLink } from 'react-router-dom';

const Home = () => (
  <Router>
    <div className="menu">
      <div>
        <ul>
          <NavLink to="/app" className="toolbar">
            Black Jack
          </NavLink>
          <NavLink to="/memoryGame" className="toolbar">
            Memory Game
          </NavLink>
        </ul>
      </div>
      <Routes>
        <Route path="/app" element={<App />} />
        <Route path="/memoryGame" element={<MemoryGame />} />
      </Routes>
    </div>
  </Router>
);




class Game extends React.Component {
  render() {
      return (
      <React.StrictMode>
        <Home />
      </React.StrictMode>
      );
}
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Game />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
