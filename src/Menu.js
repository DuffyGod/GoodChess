import React, { Component } from "react";
import { render } from "react-dom";
import "./Menu.css";
import styled from "styled-components";
import { convertColor } from "./Grid";

import {withRouter }from './withRouter.js';
import {bind} from './socketListeners.js';
import AccountBar from "./AccountBar.js";


class Menu extends React.Component {
    constructor(props) {
        super(props);
        // listen events 
        bind.call(this);
    }
    render() {
        // console.log(this.props);

        // console.log(this.props.exp);

        // props.exp[0]
        // props.exp[1]
        const Button = styled.button`
			background-color: white;
			color: black;
			font-size: 32px;
            font-family: "IBM Plex Sans", sans-serif;
            font-weight: 800;
            width: max(33%, 350px);
			padding: 15px 60px;
			border-radius: 0px;
			margin: -1px 0px;
			cursor: pointer;
		`;
        const ButtonGroup = styled.div`
        display: flex
        `
        let display = ["Play", "Tutorial", "Custom Map"];
        let to = ["/select", "/tutorial", "/map"];
        // Usage
        let nextPhaseButtons = [];
        for (let i = 0; i < display.length; i++) 
            nextPhaseButtons.push(
                <Button onClick={() => {
                    this.props.navigate(to[i]);}}>
                    {display[i]}
                </Button>
            );
        return (
			<div className="menubar" style={{display: "flex", flexDirection:"column", justifyContent:"center"}} >
                <AccountBar/>
                <h1 style={{textAlign:"center"}}>Welcome to the game!</h1>
                <div style={{width: "90%", display: "flex", flexDirection:"row", justifyContent: "space-around"}}>
                    <div style={{display: "flex", flexDirection:"column"}}>
                        <div class="v26_9">
                            </div>
                        <div class="v26_10">

                        </div><div class="v26_11">

                        </div>
                    </div>
                    <ButtonGroup
                        style={{ display: "flex", flexDirection: "column" }}
                    >
                        {nextPhaseButtons}
                    </ButtonGroup>
                    <div style={{display: "flex", flexDirection:"column", fontFamily:"Noto Sans Symbols 2"}}>
                        <div class="v26_23" style={{color: "#A604DF"}}>
                            🗡                           
                            </div>
                        <div class="v26_23" style={{color: "#3AD204"}}>
                            ♞ 
                        </div>
                        <div class="v26_23" style={{color: "#FA4005"}}>
                            💣
                        </div>
                    </div>
                    
                </div>
                
            </div>
		);
    }
}

export default withRouter(Menu);