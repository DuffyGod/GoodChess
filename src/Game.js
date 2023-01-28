import React, { Component } from "react";
import { render } from "react-dom";
import { validMoves, exps } from "./levels.js";
import Board from "./Board.js";
import Gamebar from "./Gamebar.js";
import "./Game.css";

import Cookies from 'universal-cookie';

import {withRouter }from './withRouter.js';

import NavigateBar from "./NavigateBar.js";
import {bind} from './socketListeners.js';

import {notifyNewTurn} from "./notify.js";


class Game extends React.Component {
    constructor(props) {
        super(props);
        bind.call(this);
        // read file from maps.json
        // load from maps.json
        this.state = {
            player: 0, 
            phase: 3, // 0 : spawn, 1: move, 2: upgrade, 3: choose 
            exp: [0, 0], 
            updator: 0,
            turn: 0,
            urgentInfo: "", // "The Map doesn't exist!" "😲Capital is Empty!"
            isSpawnAvailable: true
        };
        this.setPhase = this.setPhase.bind(this);
        this.gainExp = this.gainExp.bind(this);
        this.setUrgentInfo = this.setUrgentInfo.bind(this);
        this.setSpawnAvailability = this.setSpawnAvailability.bind(this);
        this.setState = this.setState.bind(this);
        this.getRole = this.getRole.bind(this);
        this.update = this.update.bind(this);
        this.infoListener = this.infoListener.bind(this);
        this.initListener = this.initListener.bind(this);
        // add socket listener to update board
        window.socket.off('update infos');
        window.socket.on('update infos', this.infoListener);
        this.cookies = new Cookies();
        console.log("Hello from Game.js constructor");
    }
    infoListener(board) {
        this.setState({phase: board.phase, player: board.player, exp: board.exp, turn: board.turn});
        if (board.player == this.getRole() && board.phase == 3) 
            notifyNewTurn();
    }
    initListener(board) {
        this.setState({phase: board.phase, player: board.player, exp: board.exp, turn: board.turn});
    }
    update() {
        let board = {
            phase: this.state.phase,
            player: this.state.player,
            exp: this.state.exp,
            turn: this.state.turn
        };
        window.socket.emit('update infos', board);
    }
    getRole() {
        return this.cookies.get('role');
    }
    gainExp(player, diff) {
        if (this.state.player != this.getRole())
            return ;
        let newexp = this.state.exp[player] + diff;
        this.state.exp[player] = newexp;
        this.setState({updator: this.state.updator + 1});
        this.update();
    }
    setUrgentInfo(info) {
        if (this.state.urgentInfo.length > 0 && info.length > 0)
            return ;
        if (this.state.urgentInfo != info) {
            this.state.urgentInfo = info;
            this.setState({updator: this.state.updator + 1});
        }
    }
    setSpawnAvailability(isAvailable) {
        if (this.state.isSpawnAvailable != isAvailable) {
            this.state.isSpawnAvailable = isAvailable;
            this.setState({updator: this.state.updator + 1});
        }
		// console.log("checkspawn: ", this.state.isSpawnAvailable);
    }
    setPhase(newPhase) {
        if (this.state.player != this.getRole())
            return ;
        // emit
       // newPhase = 3: next turn
        let newPlayer = this.state.player;
        if (newPhase === 3) {
            newPlayer = (newPlayer + 1) % 2;
            if (this.state.player == 1)
                this.state.turn += 1;
        }
        this.state.phase = newPhase;
        this.state.player = newPlayer;
        this.setState(state => {
            state.updator = state.updator + 1;
            return state;
        });
        this.update();
    }
    render() {
        // flex; horizontal
        return (
            <div>
                <NavigateBar />
                <div className="Game">
                    <div style={{display:"flex", flexDirection:"column", marginTop: "2%"}}>
                        <div style={{fontSize: "24px", fontStyle:"italic", color:"black", margin:"-10px 0px 10px 0px"}}>Room {new Cookies().get('room')}</div>
                        <div>
                            <Board
                                player={this.state.player}
                                phase={this.state.phase}
                                exp={this.state.exp}
                                gainExp={(player, diff) => this.gainExp(player, diff)}
                                setUrgentInfo={this.setUrgentInfo}
                                setSpawnAvailability={this.setSpawnAvailability}
                                initCallback={this.initListener}
                            />
                        </div>
                    </div>
                    <div style = {{width: "30%"}}>
                        <Gamebar
                            player={this.state.player}
                            phase={this.state.phase}
                            exp={this.state.exp}
                            setPhase = {(phase) => this.setPhase(phase)}
                            turn = {this.state.turn}
                            urgentInfo={this.state.urgentInfo}
                            isSpawnAvailable={this.state.isSpawnAvailable}
                        />
                    </div>
                </div>
            </div>
		);

    }
    
}

export default withRouter(Game);