import React, { Component } from "react";
// router
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { render } from "react-dom";
import styled from "styled-components";
import Cookies from 'universal-cookie';
import {withRouter }from './withRouter.js';
import {useNavigate} from 'react-router-dom';
import NavigateBar from "./NavigateBar.js";
import { minWidth } from "@mui/system";
import {bind} from './socketListeners.js';

function newTutorialGame() {
    let map = require("./maps/" + "./wall2.json");
    let room = Math.floor(Math.random() * 1000000);
    window.socket.emit('create room', room, map, true);
}
class Tutorial extends React.Component {
    constructor(props) {
        super(props);
        bind.call(this);
        this.state = {
            page: 0
        }
        this.pages = [];
        let descriptions = ["In this game, there are two options for each turn: spawning new units or moving existing units.", 
    <div>To spawn new units, a player must control a city, which is a connected group of red-background grids on the board.
    In order to control a city, a player's army must be present on at least one grid within the city, and there must be no other players or NPC armies occupying any grids within the city.
    <br/><br/>The above image outlines cities with red rectangles.
    <br/><br/> For each city a player controls, they can spawn a new pawn on an empty grid within that city. </div>, 
    <div>
        In a move action, a player can move any number of their armies, but each army can only move once per turn. 
        <br/>
        If an army moves to a grid occupied by another army, that army is eliminated and the player earns experience points. 
        <br/>
        Players earn experience points by eliminating units: 1 point for pawns or archers, and 2 points for knights or tanks.
    </div>, 
    <div>
        After taking an action, there is an upgrade phase where players can use their experience points to increase the level of their armies from pawn to archer, knight, and finally tank.
    </div>,
    <div>
        Pawns move in the cardinal directions (up, down, left, right), while archers can only move diagonally. Knights move in the pattern of a chess knight.
        <br/>
        Tanks can move in the cardinal directions but require an experience point to be spent each time they move. Tanks also have the special ability to eliminate any non-ally armies on the 8 grids illustrated above while remaining stationary. Tanks can only be obtained by upgrading a pawn three times in a row. 
    </div>, 
    <div>
        There are also non-player character (NPC) units on the board, represented by green discs. 
        
        These NPCs will only move along predetermined red-outlined tracks and will immediately eliminate any player army on track they are adjacent to, prioritizing movement in the up, down, left, right order. All NPCs are pawns.

    </div>,
    <div>
        The goal of the game is to capture the enemy's capital city. After the movement of a player, if their army is not present on their capital city, the player loses the game. 
    </div>, 
    ];
    for (let i = 0; i < descriptions.length; i++) {
        if ((window.innerWidth < 1000)){
            this.pages.push(                
                <div style={{padding:"60px 10px", display:"flex", flexDirection:"column", alignItems:"center", width:"100%", justifyContent:"center"}}>
                    <img src={require("./tutorial/" + i + ".jpeg")} style={{margin:"0px 10px", padding:"0px 20px", width:"70%"}}/>
                    <br></br>
                    <div style={{fontSize:"20px", lineHeight:"30px", maxWidth:"70%", textAlign:"left"}}> {descriptions[i]} </div>
                </div>
            )
        }
        else{
            this.pages.push(                
                <div style={{padding:"60px 10px", display:"flex", flexDirection:"row", alignItems:"flex-start", width:"90%", justifyContent:"stretch"}}>
                    <img src={require("./tutorial/" + i + ".jpeg")} style={{margin:"0px 10px", padding:"0px 20px", width:"70%"}}/>
                    <div style={{fontSize:"20px", lineHeight:"30px", maxWidth:"40%", textAlign:"left"}}> {descriptions[i]} </div>
                </div>
            )
        }           
        }
    }
    render() {
        const Button = styled.button`
        background:  "palevioletred";
        color: black;
        font-size: 2.5em;
        font-family: IBM Plex Sans;
        font-weight: bold;
        margin: 0em;
        padding: 0em 1em;
        border: 2px solid;
        border-radius: 0px;
        border-color: #ffffff;
        width:180px;
        height: 70px;
        background-color: #ffffff;
        margin-top: 10px;
        `;
        let actionBar = <div></div>; // left and right button
        actionBar = (
            <div style={{display: "flex", flexDirection:"row", justifyContent:"center", width:"60%"}}>
                <Button onClick={() => {
                    let newPage = Math.max(0, this.state.page - 1);
                    this.setState({page: newPage});
                }}>{"‹"}</Button>
                <Button onClick={() => {
                    if (this.state.page == this.pages.length-1) 
                        newTutorialGame();
                    else {
                        let newPage = Math.min(this.pages.length - 1, this.state.page + 1);
                        this.setState({page: newPage});
                    }
                }}>{this.state.page == this.pages.length-1 ? "Try it" : "›"}</Button>
            </div>
        );
        return (
            <div>
                <NavigateBar/>
            <div style={{display:"flex", flexDirection:"column", width:"100%", alignItems:"center"}}>
            <div style={{display:"flex", flexDirection:"column", width:"100%", justifyContent:"center", alignItems:"center"}}>
                <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
                    {this.pages[this.state.page]}
                </div>
                {actionBar}
            </div>
            </div>
            </div>
        );

    }
}

export default withRouter(Tutorial);