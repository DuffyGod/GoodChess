import './App.css';
import Board from './Board.js';
import React, { Component } from "react";
import { render } from "react-dom";
import Game from './Game.js';
import Mapdrawer from './Mapdrawer.js';
import TmpMapdrawer from './tmpMapDrawer.js';
import { BrowserRouter as Router,Routes, Route, Link } from 'react-router-dom';
import GameSelect from './GameSelect.js';
import Menu from './Menu.js';
import Tutorial from './Tutorial.js';
// import io
import io from 'socket.io-client';
import GameEnd from './GameEnd.js';
//use cookies
import Cookies from 'universal-cookie';
import GameRoom from './GameRoom.js';
import Account from './Account.js';

const curDomain = window.location.hostname;
const curProtocol = window.location.protocol;
const socket = io(`${curProtocol}//${curDomain}:3005`);
if (window.socket === undefined) 
  window.socket = socket;
const cookies = new Cookies();
function guestConnect() {
  let user = cookies.get('user');
  const randRange = 100000000;
  if (user === undefined || isNaN(Number(user)) || Number(user) < randRange) {
    user = Math.floor(Math.random() * randRange * 9) + randRange;
    cookies.set('user', user, { path: '/' });
  }
  window.socket.emit('connected', user);
}
let username = cookies.get('info/username');
let password = cookies.get('info/password');
if (username !== undefined && password !== undefined) {
  console.log("trying login: ", username);
  window.socket.emit('login', {username: username, password: password},
    (accountID) => {
      if (accountID > 0) {
        console.log("login successful");
        cookies.set('user', accountID, { path: '/' });
        window.socket.emit('connected', accountID);
      }
      else {
        console.log("login failed");
        // delete username and password in cookies
        cookies.remove('info/username', { path: '/' });
        cookies.remove('info/password', { path: '/' });
        guestConnect();
      }
    });
}
else {
  console.log("guest mode");
  guestConnect();
}


//window.socket = socket;
class App extends Component {
  constructor(props) {
    super(props);

  }
  render() {
    // create routers for game and room selection
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Menu />}/>
          <Route path="/account" element={<Account />}/>
          <Route path="/select" element={<GameSelect />}/>
          <Route path="/tutorial" element={<Tutorial />}/>
          <Route path="/game" element={<Game />}/>
          <Route path="/gameroom" element={<GameRoom />}/>
          <Route path="/map" element={<Mapdrawer />}/>
          <Route path="/map/admin" element={<TmpMapdrawer />}/>
          <Route path="/endgame" element={<GameEnd />}/>
        </Routes>
      </Router>
    );
  }
}

export default App;

// how to get ip address in macos terminal of localhost
// ifconfig | grep inet | grep -v inet6 | grep -v