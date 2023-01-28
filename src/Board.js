import logo from './logo.svg';
import './Board.css';
import Grid from './Grid.js';
import React, { Component } from "react";
import { render, unstable_renderSubtreeIntoContainer } from "react-dom";
import { validMoves, exps, towerKills, levels, nextLevels, getUpgradeCost} from "./levels.js";
import {modifyGrid, clearGrid, middleMove, move, checkMove, canMove} from "./BoardHelper.js";

import Cookies from 'universal-cookie';

// create class board and render it
class Board extends React.Component {
	// whose turn
	constructor(props) {
		super(props);
		console.log("Hello from board constructor");
		// add a row of grids
		// get random integer between 0 and 100
		// add flex to row
		// random init infos
    	// map: owner, level, spawnid
		this.state = {
			grids: [],
			visionRange: 2,
			fromGrid: null,
			updator: 1,
			surrenderCount: 0
		};
		//binds functions
		this.doUpgrade = this.doUpgrade.bind(this);
		this.handleMove = this.handleMove.bind(this);
		this.setFromid = this.setFromid.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.mapGrid = this.mapGrid.bind(this);
		this.initPhase = this.initPhase.bind(this);
		this.handleClickMove = this.handleClickMove.bind(this);
		this.handleClickUpgrade = this.handleClickUpgrade.bind(this);
		this.handleClickSpawn = this.handleClickSpawn.bind(this);
		this.update = this.update.bind(this);
		this.getRole = this.getRole.bind(this);
		this.getRoom = this.getRoom.bind(this);
		this.checkEnd = this.checkEnd.bind(this);
		this.checkSpawnAvailability = this.checkSpawnAvailability.bind(this);
		this.revert = this.revert.bind(this);
		this.computeHidden = this.computeHidden.bind(this);
		this.checkRevert = this.checkRevert.bind(this);
		this.gridsListener = this.gridsListener.bind(this);
		this.initListener = this.initListener.bind(this);	
		this.cleanUp = this.cleanUp.bind(this);
		this.lastState = undefined; // backward
		this.initialBoard = undefined; // backward	
		this.upgradeGrids = [];
		this.validLevels = [];
		this.cookies = new Cookies();
		this.role = new Cookies().get('role') * 1;
		// add socket listener to update board
		window.socket.off('update grids');
		window.socket.off('init');
		window.socket.on('update grids', this.gridsListener);
		window.socket.on('init', this.initListener);
		window.socket.emit('get init');
	}
	gridsListener(grids) {
		this.setState({grids: grids, updator: this.state.updator + 1});
	}
	initListener(board) {
		this.initialBoard = board;
		console.log('Received init!');
		this.state.grids = board.grids;
		this.state.visionRange = board.visionRange;
		this.validLevels = board.validLevels[this.role];
		this.props.initCallback(board);
		this.setState({updator: this.state.updator + 1});
	}
	cleanUp() {
		window.socket.off('update grids', this.gridsListener);
		window.socket.off('init', this.initListener);
	}
	
	componentWillUnmount(){
		console.log("Unmounting board");
		this.cleanUp(); //example method to clean data
	}
	computeHidden(row, col, grids) { 
		const role = this.role;
		if (role == -1) return false;
		const r = this.state.visionRange;
		//console.log("visionRange: ", r);
		if (r == -1)
			return false;
		for (let i = -r; i <= r; i++)
			for (let j = -r; j <= r; j++) {
				let x = row + i, y = col + j;
				if (x < 0 || x >= grids.length || y < 0 || y >= grids[0].length) continue;
				if (grids[x][y].owner == role) 
					return false;
			}
		return true;
	}
	checkRevert(grids, newGrids) {
		for (let i = 0; i < grids.length; i++)
			for (let j = 0; j < grids[0].length; j++) 
				if (this.computeHidden(i, j, grids)) {
					if (!this.computeHidden(i, j, newGrids)) return false;
					if (grids[i][j].owner != newGrids[i][j].owner) return false;
				}
		return true;
	}

	getRole() {
		return this.cookies.get('role');
	}
	getRoom() {
		return this.cookies.get('room');
	}
	handleMove(start, end) {
		if (checkMove(this.state.grids, start, end, this.role) > this.props.exp[this.role]) return;
		let incExp = move(this.state.grids, start, end, this.role);
		this.props.gainExp(this.role, incExp);
	}
	checkEnd() {
		if (this.state.grids.length == 0) return false;
		const role = this.role;
		if (role == -1) return false;
		const capital = role;
		for (let i = 0; i < this.state.grids.length; i++)
			for (let j = 0; j < this.state.grids[0].length; j++) {
				let cur = this.state.grids[i][j];
				if (cur.owner == role && cur.spawnid == capital) {
					this.props.setUrgentInfo("");
					return false;
				}
			}
		this.props.setUrgentInfo("😲Capital is Empty!");
		return true;
	}
	checkSpawnAvailability() {
		if (this.state.grids.length == 0) return false;
		const role = this.role;
		if (role == -1) return false;
		let havePlayer = [new Set(), new Set(), new Set()]; // all grids
		for (let i = 0; i < this.state.grids.length; i++) 
			for (let j = 0; j < this.state.grids[i].length; j++) {
				let curInfo = this.state.grids[i][j];
				if (curInfo.owner != -1 && curInfo.spawnid != -1) 
					havePlayer[curInfo.owner].add(curInfo.spawnid);
			}
		for (let i = 0; i < this.state.grids.length; i++)
			for (let j = 0; j < this.state.grids[i].length; j++) {
				let info = this.state.grids[i][j];
				if (info.owner == -1 && info.spawnid != -1) 
					if (havePlayer[this.props.player].has(info.spawnid) 
					&& !havePlayer[1 - this.props.player].has(info.spawnid)
					&& !havePlayer[2].has(info.spawnid)) {
					this.props.setSpawnAvailability(true);
					return true;
				}
			}
		this.props.setSpawnAvailability(false);
		return false;
	}

	revert() {
		if (this.lastState == undefined) return ; 
		if (this.role != this.props.player) return ;
		this.props.gainExp(this.role, this.lastState.exp[this.role] - this.props.exp[this.role]);
		const oldGrids = this.lastState.grids;
		this.setState((state) => {
			state.grids = oldGrids;
			return state;
		});
		this.lastState = undefined;
		this.update();
	}
	getSurrenderButtonEmoji() {
		if (this.state.surrenderCount == 0)
			return "🏳";
		else if (this.state.surrenderCount == 1)
			return "😭";
		else
			return "☠️";
	}
	surrender() {
		this.state.surrenderCount++;
		if (this.state.surrenderCount == 2) 
			window.socket.emit('die');
		/*else if (this.state.surrenderCount == 1) {
			document.getElementById("surrenderButton").innerHTML = this.getSurrenderButtonEmoji();
		}*/
		this.setState({updator: this.state.updator + 1});

	}

	update() {
		// socket send update board
		console.log("UPDATE");
		console.log(this.getRoom());
		window.socket.emit("update grids", this.state.grids);
		this.setState({updator: this.state.updator + 1});
	}
	setFromid(curId) {
		this.state.fromGrid = curId;
		this.setState({updator: this.state.updator + 1});
	}
	handleClickMove(row, col) {
		let curId = [row, col];
		if (this.state.fromGrid == null) {
			if (canMove(this.state.grids[row][col], this.role)) 
				this.setFromid(curId);
		} 
		else {
			this.handleMove(this.state.fromGrid, curId);
			this.setFromid(null);
		}
	}
	doUpgrade(row, col, level) {
		let curInfo = this.state.grids[row][col];
		let cost = getUpgradeCost(curInfo.level, level);
		this.props.gainExp(this.role, -cost);
		this.state.grids[row][col].level = level;
		this.upgradeGrids = [];
		this.setState({updator: this.state.updator + 1});
		
		this.update();
	}

	handleClickUpgrade(row, col) {
		let curInfo = this.state.grids[row][col];
		if (curInfo.owner != this.role) return ;
		let upgradeGrids = [];
		for (let i = 0; i < levels; i++) {
			let cost = getUpgradeCost(curInfo.level, i);
			if (i == curInfo.level) continue;
			if (cost > this.props.exp[this.role]) continue;
			if (this.validLevels.indexOf(i) == -1) continue;
			
			console.log(i, cost);
			let newInfo = {...curInfo};
			newInfo.level = i;
			let newGrid = <Grid
			{...newInfo}
			onClick={() => {this.doUpgrade(row, col, i)}}></Grid>;
			upgradeGrids.push(newGrid);
		}
		this.upgradeGrids = upgradeGrids;
		this.setState({updator: this.state.updator + 1});
	}
	handleClickSpawn(row, col) {
		let curInfo = {...this.state.grids[row][col]};
		if (curInfo.owner != -1) return ;
		if (!curInfo.canSpawn) return ;
		curInfo.owner = this.role;
		curInfo.level = 0;
		//console.log("Spawn at ", row, col, "player", this.props.player);
		modifyGrid(this.state.grids, row, col, {...curInfo});
		//console.log("modify grid", this.state.grids[row][col]);
		this.mapGrid((newGrid) => {
			if (newGrid.canSpawn && newGrid.spawnid == curInfo.spawnid) 
				newGrid.canSpawn = false;
			// if (i == row && j == col) newGrid.canSpawn = false;
			return newGrid;
		});
	}

	handleClick(row, col) {
		this.state.surrenderCount = 0; // end surrender by any click
		//document.getElementById("surrenderButton").innerHTML = this.getSurrenderButtonEmoji();
		this.setState((state) => {
			state.updator += 1;
			return state;
		});

		if (this.role != this.props.player) return ;
		//console.log("clicked", row, col);

		const oldGrids =  JSON.parse(JSON.stringify(this.state.grids));
		const oldExp = [...this.props.exp];
		if (this.props.phase == 1)  // move
			this.handleClickMove(row, col);
		else if (this.props.phase == 2)  // upgrade
			this.handleClickUpgrade(row, col);
		else if (this.props.phase == 0)  // spawn
			this.handleClickSpawn(row, col);
		middleMove(this.state.grids);
		if (JSON.stringify(oldGrids) != JSON.stringify(this.state.grids)) {
			this.lastState = {grids: oldGrids, exp: oldExp};
			console.log("Checks!");
			if (!this.checkRevert(oldGrids, this.state.grids)) this.lastState = undefined;
		}
		this.update();
	}
	mapGrid(func) {
		//console.log("Map grid");
		for (let i = 0; i < this.state.grids.length; i++)
			for (let j = 0; j < this.state.grids[i].length; j++) {
				let curInfo = { ...this.state.grids[i][j] };
				this.state.grids[i][j] = func(curInfo);
			}
	}
	
	initPhase() {
		this.lastState = undefined;
		this.state.fromGrid = null;
		this.upgradeGrids = [];
		if (this.props.phase == 3) { // choose
			/*if (this.props.player == this.role) {
				this.checkSpawnAvailability();
			}*/
			if (this.props.player != this.role && this.role != -1) {
				if (this.checkEnd()) 
					window.socket.emit("die");
			}
			this.mapGrid((info) => {info.moved = (info.owner == 1 - this.props.player); return info});
		}
		else if (this.props.phase == 1) { // move
			this.mapGrid((info) => {
				info.moved = (info.owner != this.props.player); 
				return info;
			});
		}
		else if (this.props.phase == 0) { // spawn
			//this.checkSpawnAvailability();
		// create two sets
			let havePlayer = [new Set(), new Set(), new Set()]; // all grids
			for (let i = 0; i < this.state.grids.length; i++) 
				for (let j = 0; j < this.state.grids[i].length; j++) {
					let curInfo = this.state.grids[i][j];
					//console.log(curInfo);
					if (curInfo.owner != -1 && curInfo.spawnid != -1) 
						havePlayer[curInfo.owner].add(curInfo.spawnid);
				}
			this.mapGrid((info) => {
				info.canSpawn = false; 
				if (info.owner == -1 && info.spawnid != -1) 
				if (havePlayer[this.props.player].has(info.spawnid) 
				&& !havePlayer[1 - this.props.player].has(info.spawnid)
				&& !havePlayer[2].has(info.spawnid))
					info.canSpawn = true;
				info.moved = (info.owner == 1 - this.props.player);
				return info;
			});
		}
		else if (this.props.phase == 2) { // upgrade
			this.mapGrid((info) => {
				// if (info.level == 0) info.canTower = true;
				// else info.canTower = false;
				info.moved = (info.owner == 1 - this.props.player);
				return info;
			});
		}
		if (this.props.player == this.role)
			this.update();
	}
	componentDidUpdate(prevProps) {
		let initP = true;
		if (this.initialBoard) {
			console.log("Overwrite!");
			if (this.initialBoard.phase == this.props.phase && this.initialBoard.player == this.props.player) 
				initP = false;
			this.initialBoard = undefined;  
		}
		if (this.props.phase != prevProps.phase && initP) 
      		this.initPhase();
	}

	render() {
		if (this.state.grids.length == 0)
			this.props.setUrgentInfo("Invalid Map!");
		else if (this.role == -1)
			this.props.setUrgentInfo("");
		else {
			this.checkEnd();
			this.checkSpawnAvailability();
		}
		let computeHighlight = (row, col) => {
			if (this.props.phase == 0) {
				return this.state.grids[row][col].canSpawn;
			}
			else if (this.props.phase == 1) {
				//console.log("Highlight-move!");
				if (this.state.fromGrid != null) 
					if (checkMove(this.state.grids, this.state.fromGrid, [row, col], this.props.player) <= this.props.exp[this.props.player]) 
						return true;
				return false;
			}
			else if (this.props.phase == 2) {
				if (this.props.exp[this.props.player] == 0) return ;
				let curInfo = this.state.grids[row][col];
				if (curInfo.owner != this.props.player) return false;
				if (curInfo.level == 3) return false;
				// if (curInfo.level == 2 && !curInfo.canTower) return false;
				return true;
			}
			return false;
		}
		return this.state.grids.length == 0
		? (
			<div>
				<div style={{fontSize:"42px"}}>Error: The Map is Empty!</div>
				<br/>
				<div style={{fontSize:"28px"}}><b>Possibility 1: </b>Loading... Please wait or refresh.</div>
				<p></p>
				<div style={{fontSize:"28px"}}><b>Possibility 2: </b>The Game has already ended.</div>
				<p></p>
				<div style={{fontSize:"28px"}}><b>Possibility 3: </b>The Game doesn't exist.</div>
			</div>)
		: (
			<div style={{display:"flex", flexDirection:"column"}}>
			<div className="Board">
				{this.state.grids.map((row, i) => (
					<div className="Board-row" key={i}>
						{row.map((grid, j) => (
							<Grid
								key={j}
								row={i}
								col={j}
								owner={grid.owner}
								level={grid.level}
								moved={grid.moved}
								hidden = {this.computeHidden(i, j, this.state.grids)}
								spawnid = {grid.spawnid}
								ontrack = {grid.ontrack}
								highlight={computeHighlight(i, j)}
								onClick={() => this.handleClick(i, j)}
							/>
						))}
					</div>
				))}
			</div>
			{this.role != -1 ? 
			(
			<div style={{display:"flex", justifyContent: "center"}}>
				<button id="revertButton" className="Button" onClick={() => this.revert()} style={{filter: this.lastState? "brightness(1)"
							: "brightness(0.8)"}}>⮌</button>
				<button id="surrenderButton" className="Button" onClick={() => this.surrender()}>{this.getSurrenderButtonEmoji()}</button> 
			</div>)
			: null}
			
			<div className="Board-row" style={{marginTop:"10px"}}>
				{this.upgradeGrids}
			</div>
			

			</div>
		);
	}
}
// undo symbol: ↶
// 🕊
export default Board;
