import 'bulma/css/bulma.css'
import './App.css';
//for css styling

import Home from './Home.js';
import Profile from './Profile.js';
import Navbar from './Navbar';

import {BrowserRouter as Router, Switch, Route } from 'react-router-dom'

function App() {
  let user
  
  return (
    <Router>
      <div class="App">
        <Navbar />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/profile">
            <Profile />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
