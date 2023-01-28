import React, { Component } from "react";
import { render } from "react-dom";
import "./Gamebar.css";
import styled from "styled-components";
import { convertColor } from "./Grid";
import Cookies from "universal-cookie";
import {withRouter}from './withRouter.js';

function phaseToText(phase) {
    if (phase === 0) return "Spawn";
    else if (phase === 1) return "Move";
    else if (phase === 2) return "Upgrade";
    else if (phase === 3) return "End turn";
}

class Gamebar extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        // console.log(this.props);

        // console.log(this.props.exp);

        // props.exp[0]
        // props.exp[1]
        const Button = styled.button`
			background-color: white;
			color: black;
			font-size: 20px;
			padding: 10px 60px;
			border-radius: 5px;
			margin: 10px 0px;
			cursor: pointer;
		`;
        const ButtonGroup = styled.div`
        display: flex
        `
        // Usage
        // 0 : spawn, 1: move, 2: upgrade, 3: choose 
        let nextPhases = [];
        if (this.props.phase === 0) 
            nextPhases = [2];
        else if (this.props.phase === 1)
            nextPhases = [2];
        else if (this.props.phase === 2)
            nextPhases = [3];
        else if (this.props.phase === 3) {
            //console.log("isSpawnAvailable: ", this.props.isSpawnAvailable);
            if (this.props.isSpawnAvailable)
                nextPhases = [1, 0];
            else
                nextPhases = [1];
        }
        let nextPhaseButtons = [];
        for (let i = 0; i < nextPhases.length; i++) 
            nextPhaseButtons.push(
                <Button onClick={() => {
                    this.props.setPhase(nextPhases[i])}}>
                    {phaseToText(nextPhases[i])}
                </Button>
            );
        const role = (new Cookies().get('role')) * 1;
        const isTurn = (this.props.player == role);
        if (!isTurn) nextPhaseButtons = [];
        if (role == -1) nextPhaseButtons = [
            <Button onClick={() => {
                window.socket.emit('exit room');
                this.props.navigate('/select');}}>
                Exit
            </Button>
        ];
        let description = "";
        if (isTurn) description = "Phase: " + (this.props.phase == 3
                            ? "Selecting action"
                            : phaseToText(this.props.phase));
        else description = "Waiting for the opponent...";
        if (role == -1) description = "Player " + this.props.player + " is moving...";
        let expbar = (<div></div>);
        if (role != -1) expbar = (
            <div style={{display: "flex", alignItems: "flex-end"}}>
            <div style={{fontSize: "96px", paddingRight:"0px",  color: convertColor(role) }}> {this.props.exp[role]} </div>
            <div style={{fontSize: "24px",  color: convertColor(role), paddingBottom: "28px" }}>EXP</div>
            </div>
        );
        else {
            let contents = [];
            for (let i = 0; i < 2; i++) {
                contents.push(<div style={{display: "flex", alignItems: "flex-end"}}>
                    <div style={{fontSize: "72px", paddingRight:"0px",  color: convertColor(i) }}> {this.props.exp[i]} </div>
                    <div style={{fontSize: "24px",  color: convertColor(i), paddingBottom: "18px" }}>EXP</div>
                </div>)
            }
            expbar = (
            <div style={{display:"flex", flexDirection:"column"}}>
                {contents}
            </div>)
        };
        const isMapInvalid = (this.props.urgentInfo == "Invalid Map!");
        return (
			<div className="gamebar">
                {role == -1 ? (<div style={{fontWeight: "600", marginBottom:"10px"}}>Spectator Mode</div>) : ""}
                <div>Turn {this.props.turn}</div>
                {expbar}
                <div style={{color: convertColor(this.props.player) }}>
                    {isMapInvalid ? "" : description}
                </div>
                <div style={{color: "#BE002F", fontWeight: "600"}}>
                    {this.props.urgentInfo}
                </div>
				{
                    isMapInvalid
                    ? (<div></div>)
                    : (<ButtonGroup
                        style={{ display: "flex", flexDirection: "column", marginTop:"20px" }}
                    >
                        {nextPhaseButtons}
                    </ButtonGroup>)
                }
			</div>
		);
    }
}

// <div className="info" style={{marginLeft: "0px"}}>                    								
// </div>

export default withRouter(Gamebar);