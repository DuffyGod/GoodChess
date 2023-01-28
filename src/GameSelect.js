import React, { Component } from "react";
// router
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { render } from "react-dom";
import "./Gamebar.css";
import styled from "styled-components";
import { convertColor } from "./Grid";
import Cookies from 'universal-cookie';
import {withRouter }from './withRouter.js';
import NavigateBar from "./NavigateBar.js";
import AccountBar from "./AccountBar.js";
import Previewcard from "./PreviewCard.js";
import {bind} from './socketListeners.js';

import {mapList} from "./GameRoom.js";

class GameSelect extends React.Component {
    constructor(props) {
        super(props);
        bind.call(this);
        this.state = {
            roomList: []
        }
        window.socket.emit('check start');
        window.socket.off('room list');
        window.socket.on('room list', (rooms) => {
            this.setState({roomList: rooms});
        });
        window.socket.emit('get room list');
    }
    render() {
        const Button = styled.button`
        background:  "palevioletred";
        color: black;
        font-size: 1.5em;
        font-family: IBM Plex Sans, sans-serif;
        font-weight: 600;
        margin: 1em;
        padding: 0.1em 0.1em;
        border: 2px solid;
        border-radius: 5px;
        border-color: #000000;
        width: 280px;
        height: 60px;
        background-color: #ffffff;
        margin-top: 50px;
        margin-bottom: 40px;
        `;
        console.log("room list: ", this.state.roomList);
        let roomList = this.state.roomList.map((info) => {
            return (
                <Previewcard room={info.room} users={info.users} started={info.started} canSpectate={info.canSpectate}/>
            )
        });
        //let defaultMap = require("./maps" + "/prison2.json");
        // 改成随机取了
        let defaultMap = JSON.parse(JSON.stringify(require("./maps/" + mapList[Math.floor(Math.random() * mapList.length)][1])));
        return (
            // display the room list

            <div className="room-list"> 
                <NavigateBar/>
                <AccountBar/>
                <div sytle={{display:"flex", justifyContent:"space-around"}}>
                    <div className="button-container" style={{marginLeft: "100px"}}>  
                        <Button onClick={() => {
                            console.log("create room");
                            console.log(window.socket);
                            const newRoom = Math.floor(Math.random() * 1000000);
                            const cookies = new Cookies();
                            cookies.set('room', newRoom, { path: '/' });
                            window.socket.emit('create room', newRoom, defaultMap);
                            this.props.navigate('/gameroom');
                        }}>Create Room</Button>
                        <hr align="left" color="gold" size= "5"></hr>
                        <div style={{paddingTop: "20px", paddingLeft: "25px", paddingBottom: "15px", maxWidth:"max(40.5%, 100px)", display: "flex", justifyContent: "space-between"}}>
                            <div style={{fontSize: "24px", fontWeight: "600"}}>
                                Room
                            </div>
                            <div style={{fontSize: "24px", fontWeight: "400"}}>
                                Users
                            </div>
                        </div>
                        
                    </div>
                    <div style={{paddingLeft: "125px", paddingTop:"10px", paddingBottom: "10px", fontSize: "18px"}} className="room-list-container">
                        {this.state.roomList.length > 0 ? roomList : "No room at the moment :("}
                    </div>
                </div>

            </div>
        );

    }
}

export default withRouter(GameSelect);