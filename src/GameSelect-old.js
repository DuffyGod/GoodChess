import React, { Component } from "react";
// router
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { render } from "react-dom";
import "./Gamebar.css";
import styled from "styled-components";
import { convertColor } from "./Grid";
import Cookies from 'universal-cookie';
import {withRouter }from './withRouter.js';


class GameSelect extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            room: null
        }
    }
    handleRoomChange(e) {
        this.setState({room: e.target.value});
    }
    render() {
        const Button = styled.button`
        background:  "palevioletred";
        color: black;
        font-size: 1.5em;
        
        margin: 1em;
        padding: 0.25em 1em;
        border: 2px solid;
        border-radius: 20px;
        border-color: #62a2c2;
        width:180px;
        height: 70px;
        background-color: #92e2f2;
        margin-top: 50px;
        `;
        return (
            <div className="GameSelect" style={{display: "flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"500px"}} >
                <div className="GameSelect-Title">
                    <h1>Enter the Room id to join!</h1>
                </div>
                    <div className="GameSelect-Body-Input">
                        <input type="text" placeholder="Room ID" 
                            onChange={(e) => this.handleRoomChange(e)}  
                            style={{width:"270px", height:"50px", fontSize:"30px", border:"0px",borderBottom:"1px solid grey", paddingTop:"30px", textAlign:"center", outline:"None"}}/>
                    </div>
                    <div className="GameSelect-Body-Button">
                        <Button onClick={() => {

                            const cookies = new Cookies();
                            cookies.set('room', this.state.room, { path: '/' });

                            // get windows.socket
                            const socket = window.socket;
                            socket.emit('join room', this.state.room);
                            socket.on('start game', (role) => {
                                console.log("New role: " + role);
                                const cookies = new Cookies();
                                cookies.set('role', role, { path: '/' });
                                console.log("start game: ", this.state.room);
                                this.props.navigate('/game');
                                // navigate to game
                            });
                        }}>Join Room</Button>
                    </div>
            </div>
        );

    }
}

export default withRouter(GameSelect);