import React, { Component } from "react";
import { render } from "react-dom";
import "./Gamebar.css";
import styled from "styled-components";
import { convertColor } from "./Grid";
import Cookies from "universal-cookie";
import NavigateBar from "./NavigateBar.js";


class GameEnd extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const role = (new Cookies().get('role')) * 1;
        const winner = new Cookies().get('winner');
        const isWinner = (winner == role);
        console.log("winner", winner);
        let line1 = "";
        if (role == -1) line1 = "Player " + winner + " wins!";
        else line1 = isWinner? "You win!" : "You lose!";
        let line2 = "";
        if (role != -1) line2 = isWinner? "Congrats!" : "Better luck next time!";
        else line2 = "You are a spectator.";
        let colorStr = (role==-1 ? convertColor(winner) : "");
        //console.log(colorStr);
            return (
                <div>
                <NavigateBar/>
                <div className="GameEnd" style={{display: "flex", flexDirection:"column", justifyContent: "center", alignItems:"flex-start", width: "100%", height: "50%", marginLeft:"150px", textAlign:"center"}}>
                    <h1 style={{marginTop:"60px", color:colorStr }}> {line1}</h1>
                    
                    <h2>{line2}</h2>
                </div>
                <hr></hr>
                </div>
            )
    }
}

export default GameEnd;