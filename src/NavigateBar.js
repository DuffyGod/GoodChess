import React, { useState, useEffect } from "react";
import "./NavigateBar.css";
import { Link, useNavigate } from "react-router-dom";
import Cookies from 'universal-cookie';
import { lineHeight } from "@mui/system";
import { toggleSound } from "./notify";


function NavigateBar(props) {
  const [sound, setSound] = useState(new Cookies().get('sound') == 'off' ? "volume_off" : "volume_up");
  const handleSound = () => {
    console.log("sound");
    toggleSound();
    setSound(new Cookies().get('sound') == 'off' ? "volume_off" : "volume_up");
  };
  let soundButton =
    (<span class="material-symbols-outlined" style={{ fontStretch: "1000%" }} onClick={() => handleSound()}>
      {new Cookies().get('sound') == 'off' ? "volume_off" : "volume_up"}
    </span>);
  return (
    <div>
      <div className="navbar">
        <Link to="/" className="link">
          <div className="navbar-banner">
            <span className="navbar-info">Home</span>
            <span className="navbar-icon">🏛</span>
          </div>
        </Link>
        <Link to="/select" className="link">
          <div className="navbar-banner">
            <span className="navbar-info">Play</span>
            <span className="navbar-icon">🎮</span>
          </div>
        </Link>
        <Link to="/tutorial" className="link">
          <div className="navbar-banner">
            <span className="navbar-info">Tutorial</span>
            <span className="navbar-icon">📚</span>
          </div>
        </Link>
        <Link to="/map" className="link" >
          <div className="navbar-banner">
            <span className="navbar-info">Custom<br />Map </span>
            <span className="navbar-icon">✎</span>
          </div>
        </Link>
        {soundButton}
      </div>
    </div>)
}


export default NavigateBar;