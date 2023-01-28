import React, { Component } from "react";
import { render } from "react-dom";
import { validMoves, exps, levels } from "./levels.js";
import Board from "./Board.js";
import Gamebar from "./Gamebar.js";
import "./GameRoom.css";
import "./Board.css";

import Cookies from 'universal-cookie';

import {withRouter }from './withRouter.js';

import NavigateBar from "./NavigateBar.js";
import Grid from "./Grid.js";
import {notifyNewPlayer} from "./notify.js";

import styled from "styled-components";

import { convertColor } from "./Grid.js";
import {bind} from './socketListeners.js';
import Select from 'react-select';

export const mapList = [["Great Wall", "wall2.json"], ["Volleyball", "volleyball.json"], ["Ocean", "ocean.json"], ["Prison", "prison2.json"], ["Courtyard (Luogu)", "luogu.json"], ["Orthogonal", "orthogonal.json"], ["Great Wall II", "wall3.json"]];

class GameRoom extends React.Component {
    constructor(props) {
        super(props);
        bind.call(this);
        let map = JSON.parse(JSON.stringify(require("./maps/" + mapList[Math.floor(Math.random() * mapList.length)][1])));
        this.state = {
            map: map,
            users: [],
            updator: 0,
            settingType: Math.floor(Math.random() * 2),
            visionRange: 2,
            canSpectate: true
        };
        this.Select = "";
        this.startAction = this.startAction.bind(this);
        this.changeHandler = this.changeHandler.bind(this);
        this.handleUpload = this.handleUpload.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.setVision = this.setVision.bind(this);
        this.swapUsers = this.swapUsers.bind(this);
        this.setSpectate = this.setSpectate.bind(this);
        this.selectLevel = this.selectLevel.bind(this);
        this.selectedLevels = [0, 1, 2, 3];
        this.allLevels = [0, 1, 2, 3];
        window.socket.off('update room map');
        window.socket.on('update room map', (map) => {
            console.log("update room map", map);
            this.setState({map: map});
        });
        window.socket.off('update room vision');
        window.socket.on('update room vision', (visionRange) => {
            console.log("update room vision", visionRange);
            this.setState({visionRange: visionRange});
        });
        window.socket.off('update room spectate');
        window.socket.on('update room spectate', (canSpectate) => {
            console.log("update room spectate", canSpectate);
            this.setState({canSpectate: canSpectate});
        });
        // update bufferMap to the current map
        this.bufferMap = this.map;
        window.socket.off('update room users');
        window.socket.on('update room users', (users) => {
            console.log("Received users", users);
            if (this.state.users.length == 1 && users.length == 2)
                notifyNewPlayer();
            this.setState({users: users});
        });
        this.selectedLevels = [0, 1, 2, 3];
        this.unlockedLevels = [0, 1, 2, 3];
        window.socket.off('update unlocked levels');
        window.socket.on('update unlocked levels', (unlockedLevels) => {
            this.unlockedLevels = unlockedLevels;
            this.setState({updator: this.state.updator + 1});
        });
        // get room from cookies
        console.log("GameRoom!!! ");
        window.socket.emit('get room info', new Cookies().get('room'));
    }
    startAction() {
        if (this.state.users.length == 0)
            return ;
        if (this.state.users.length == 2)
            window.socket.emit('start game', new Cookies().get('room'));
        else if (this.state.users.length == 1)
            window.socket.emit('add bot', new Cookies().get('room'));
    }
    changeHandler(event) {
        let outer = this;
        let reader = new FileReader();
        const content = reader.readAsText(event.target.files[0]);
        reader.onload = function (e) {
            let map = JSON.parse(e.target.result);
            if (map == null)
                return ;
            console.log("RESULT", map);
            console.log(map);
            outer.bufferMap = map;
        }
    };
    handleUpload() {
        if (this.bufferMap == null)
            return ;
        console.log("uploading");
        console.log(this.bufferMap);
        //this.map = this.bufferMap;
        //this.setState({updator: this.state.updator + 1});
        this.Select = "";
        window.socket.emit('choose room map', this.bufferMap);
    }
    handleSelect(mapFile) {
        console.log("selecting", mapFile);
        const newMap = JSON.parse(JSON.stringify(require("./maps/" + mapFile.value)));
        //this.state.map = newMap;
        //this.setState({updator: this.state.updator + 1});
        this.Select = mapFile;
        window.socket.emit('choose room map', newMap);
    }
    setVision(e) {
        const value = e.target.value;
        //this.setState({ visionRange: parseInt(value) });
        //console.log("set vision range", value);
        window.socket.emit('set room vision', value);
    }
    swapUsers() {
        if (this.state.users.length < 2)
            return ;
        window.socket.emit('swap room users');
    }
    setSpectate() {
        const newSpectate = !this.state.canSpectate;
        //this.setState({ canSpectate: newSpectate });
        window.socket.emit('set room spectate', newSpectate);
    }
    selectLevel(level) {
        if (level == 0) return ;
        if (this.selectedLevels.includes(level)) {
            this.selectedLevels = this.selectedLevels.filter((l) => l != level);
        } 
        else if (this.selectedLevels.length < 4) {
            this.selectedLevels.push(level);
            if (this.selectedLevels.length == 4)
                window.socket.emit('set room levels', this.selectedLevels);
        }
        this.setState({updator: this.state.updator + 1});
    }

    render() {
        let options = [];
        for (let i = 0; i < mapList.length; i++) {
            options.push({value: mapList[i][1], label: mapList[i][0]});
        }
        //console.log(options);
        console.log("users:", this.state.users);

        const you = new Cookies().get('user');
        const role = this.state.users[0] == you ? 0 : 1;
        //console.log(this.state.map);
        let board = <div className="Board" style={{marginTop:"100px"}}>
            {this.state.map.map((row, i) => (
                <div className="Board-row" key={i}>
                    {row.map((grid, j) => (
                        <Grid
                            key={j}
                            row={i}
                            col={j}
                            owner={grid.owner}
                            level={grid.level}
                            moved={false}
                            spawnid={grid.spawnid}
                            ontrack={grid.ontrack}
                            highlight={false}
                            hidden={false}
                        />
                    ))}
                </div>
            ))}
    </div>
    let userList = <div className="Gameroom-users" style={{display:"flex", fontSize:"24px", flexDirection:"column", marginLeft: "0px"}}>
        <div style={{textAlign:"left", fontSize:"32px", marginTop:"40px", paddingBottom: "15px"}}>
            RoomID : {new Cookies().get('room')}
        </div>
        <div style={{display:"flex", flexDirection: "row"}}>
           <div style={{textAlign:"left", fontSize:"32px"}}>
                Users:
            </div> 
            <div>
                {this.state.users.map((user, i) => (
                    <div className="Gameroom-user-name" style={{paddingLeft: "12px", paddingTop:"8px", color:convertColor(i)}}>{user + (user == you ? " (You)" : "")}</div>
                ))}
                {this.state.users.length == 0
                    ? <div>
                        <div style={{paddingLeft: "12px", paddingTop:"8px", color:convertColor(-1)}}>
                            Connecting...
                        </div>
                    </div>
                    : "" }
                {this.state.users.length == 1
                    ? <div style={{fontSize:"20px", fontStyle:"italic", paddingLeft: "12px", paddingTop:"12px", color:convertColor(-1)}}>
                        Waiting for an opponent...
                        <br/>
                        You may invite a <b>Bot</b>.
                    </div>
                    : "" }
            </div>
        </div>
        
    </div>;
     const Button = styled.button`
     background-color: white;
     color: black;
     font-family: IBM Plex Sans, sans-serif;
     font-weight: 600;
     font-size: 20px;
     padding: 10px 30px;
     border-radius: 5px;
     margin: 10px 0px;
     cursor: pointer;
    `;
    const Buttonsmal = styled.button`
    background-color: white;
    color: black;
    font-family: IBM Plex Sans, sans-serif;
    font-weight: 500;
    font-size: 18px;
    padding: 8px 10px;
    border-radius: 0px;
    margin: 10px;
    cursor: pointer;
   `;
   
    let startButton = (<Button className="Gameroom-start" style={{marginTop:"32px"}} onClick={this.startAction}> { this.state.users.length <= 1 ? (this.state.users.length == 1 ? "🤖Bot" : "Waiting...") : "Start" } </Button>);
    let exitButton = (<Button className="Gameroom-exit" style={{marginTop:"10px"}} onClick={() => {
        window.socket.emit('exit room');
        this.props.navigate('/select');
    }}>Exit </Button>);
    
    let setMapButton = (<Buttonsmal className="Gameroom-map" style={{}} onClick={() => {
        if (this.state.settingType != 0) this.setState({settingType: 0});
    }}>{this.state.settingType == 0 ? "■ Select Map" : "□ Select Map"}</Buttonsmal>);
    let setParaButton = (<Buttonsmal className="Gameroom-parameters" style={{}} onClick={() => {
        if (this.state.settingType != 1) this.setState({settingType: 1});
    }}>{this.state.settingType == 1 ? "■ Parameters" : "□ Parameters"}</Buttonsmal>);
    
    let SelectMapText = <div style={{textAlign:"left", fontSize:"24px", fontWeight:"500", marginTop:"0px", paddingBottom: "8px"}}>
            Select map:
        </div>
    let UploadMapText = <div style={{textAlign:"left", fontSize:"24px", fontWeight:"500", marginTop:"0px", paddingBottom: "8px"}}>
            Upload map file:
        </div>

    let uploadButton = 
        (
        <div style={{width:"min(100%,max(300px,80%))",display:"flex", flexDirection:"column", justifyContent:"flex-start", padding:"12px", margin:"0px"}}>
            
            <div style={{marginBottom:"20px"}}>
                <Select
                    value={this.Select}
                    onChange={this.handleSelect}
                    options={options}
                    isSearchable={false}>
                </Select>
            </div>
            
            <input type="file" name="file" onChange={this.changeHandler}/>
            <Button onClick={this.handleUpload}>Upload Custom Map</Button>
        </div>
        );
    let paraList = (
        <div style={{display:"flex", flexDirection:"column", justifyContent:"flex-start", padding:"12px"}}>
            <div style={{margin:"5px", display:"flex", flexDirection:"row", textAlign:"left", fontSize:"24px", fontWeight:"500"}}>
                Vision: 
                <form>
                    <label style={{marginLeft:"6px"}}><input type="radio" value="2" onChange={this.setVision} checked={this.state.visionRange==2}/>
                        5×5</label>
                    <label style={{marginLeft:"6px"}}><input type="radio" value="3" onChange={this.setVision} checked={this.state.visionRange==3}/>
                        7×7</label>
                    <label style={{marginLeft:"6px"}}><input type="radio" value="-1" onChange={this.setVision} checked={this.state.visionRange==-1}/>
                        ∞</label>
                </form>
            </div>
            <Buttonsmal onClick={this.swapUsers} style={{border:"1px solid", borderColor:"black"}}>
                {this.state.users.length < 2 ? "(Switch first move)" : "Switch first move " + (you == this.state.users[0] ? "(You)" : "(Opp.)")}
            </Buttonsmal>
            <Buttonsmal onClick={this.setSpectate} style={{border:"1px solid", borderColor:"black"}}>
                {"Allow Spectators: " + (this.state.canSpectate ? "Yes" : "No")}
            </Buttonsmal>
        </div>
    );

    let selectPieces = [];
    for (let i = 0; i < levels; i++) {
        if (this.unlockedLevels.indexOf(i) == -1) continue;
        selectPieces.push(
            <Grid 
            level = {i}
            highlight = {false}
            onClick = {()=>{this.selectLevel(i)}}
            owner = {role}
            ontrack={false}
            moved = {false}
            spawnid = {this.selectedLevels.indexOf(i) == -1 ? -1 : role}
            hidden={false}
            ></Grid>
        );
    }
    let selectPiecesList = 
    <div className="Board-row" style={{marginTop:"10px"}}>
        {selectPieces}
    </div>

    let leftList = <div style={{display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", width:"350px"}}>
        {userList}
        <div style={{display:"flex", flexDirection:"column", justifyContent:"flex-start", alignItems:"center", marginLeft:"24px"}}>    
            {startButton}
            {exitButton}
            <div style={{marginTop:"20px", display:"flex", flexDirection:"row", justifyContent:"center"}}>
                {setMapButton}
                {setParaButton}
            </div>
            {this.state.settingType == 0 ? uploadButton : paraList}
            {this.state.settingType == 1 ? selectPiecesList : null}
        </div>
    </div>
        const isWidthEnough = (document.documentElement.clientWidth > 1024);
        //console.log("current page width: ", document.documentElement.clientWidth);
        return (
            <div>
                <div className="Gameroom" style={{position:"relative", display:"flex", flexDirection:"row", alignItems:"flex-start",
                    justifyContent: isWidthEnough ? "flex-start" : "flex-end"}}>
                    <div className="Gameroom-leftlist" style = {
                            isWidthEnough
                            ? {position:"relative", left:"144px"}
                            : {position:"absolute", left:"80px"} }>
                        {leftList}
                    </div>
                    <NavigateBar/>
                    <div className="Gameroom-board" style = {
                            isWidthEnough
                            ? {position:"relative", marginLeft:"180px", display: "flex"}
                            : {position:"relative", marginRight:"20px", display: "flex"} }>
                        {board}
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(GameRoom);