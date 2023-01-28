import './Board.css';
import Grid from './Grid.js';
import React, { Component } from "react";
import { render } from "react-dom";
//use react slider
import Select from 'react-select';

import styled from "styled-components";
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';

import NavigateBar from './NavigateBar';
import AccountBar from './AccountBar';
import {bind} from './socketListeners';
import {withRouter }from './withRouter.js';
import {mapList} from './GameRoom.js';

// create class board and render it
function defaultGrid() {
	return {
		owner: -1, 
		level: -1,
		spawnid: -1,
		ontrack: 0, 
		highlight: false
	};
}
class Mapdrawer extends React.Component {
	// whose turn
	constructor(props) {
		console.log("Hello from Mapdrawer constructor");
		super(props);
		bind.call(this);
		let info = [];
		const row = 8, col = 8;
		for (let i = 0; i < row; i++) {
			let rowinfo = [];
			for (let j = 0; j < col; j++) 
				rowinfo.push(defaultGrid());
			info.push(rowinfo);
		}
		this.state = {
			spawnid: 2,
			owner: 0,
			level: 0,
			row: row, 
			col: col,
			ontrack: 0,
			grids: info,
			highlight: false,
			startSave: false,
			capitals: [-1, -1],
			validCapitalNum: -1,
			updator: 0
		};
		this.components = [];
		this.mapSelect = "";
		this.bufferMap = null;
		//binds functions
		this.newGrid = this.newGrid.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.computeComponents = this.computeComponents.bind(this);
		this.handlePropertyChange = this.handlePropertyChange.bind(this);
		this.handleUpload = this.handleUpload.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
		this.changeHandler = this.changeHandler.bind(this);

		this.justifySize = this.justifySize.bind(this);
		this.save = this.save.bind(this);
		this.savemap = this.savemap.bind(this);
	}
	newGrid() {
		return {
			owner: this.state.owner * 1, 
			level: this.state.owner == -1 ? -1: this.state.owner == 2 ? Math.max(this.state.level, 0) : this.state.level * 1,
			spawnid: this.state.spawnid * 1,
			ontrack: this.state.ontrack * 1, 
			highlight: this.state.highlight
		};
	}
	handleClick(p, q) {
		console.log("click at ", p, q, this.state.grids[p][q]);
		if (this.state.startSave) {
			let i = this.state.grids[p][q].spawnid - 3;
			if (i < 0 || i >= this.components.length) return ;
			if (this.components[i][1] == 0) return ;
			let owner = this.state.grids[p][q].owner;
			if (owner != 0 && owner != 1) {
				for (let j = 0; j < this.components[i][0].length; j++) {
					const x = this.components[i][0][j][0];
					const y = this.components[i][0][j][1];
					const tmp = this.state.grids[x][y].owner;
					if (tmp == 0 || tmp == 1) {
						owner = tmp;
						break;
					}
				}
			}
			/*for (let i = 0; i < this.state.row; i++)
				for (let j = 0; j < this.state.col; j++)
					if (this.state.grids[i][j].spawnid == spawnid) {
							let tmp = this.state.grids[i][j].owner;
							if (tmp == 0 || tmp == 1) {
								if (owner == -1)
									owner = this.state.grids[i][j].owner;
								else if (owner >= 0 && 1 - owner == tmp)
									owner = -2;
							}
							break;
						}*/
			this.state.capitals[owner] = i + 3;
			if (this.state.capitals[0] != -1 && this.state.capitals[1] != -1) {
				for (let i = 0; i < this.state.row; i++)
					for (let j = 0; j < this.state.col; j++) {
						if (this.state.grids[i][j].spawnid == this.state.capitals[0])
							this.state.grids[i][j].spawnid = 0;
						if (this.state.grids[i][j].spawnid == this.state.capitals[1])
							this.state.grids[i][j].spawnid = 1;
					}
				this.savemap();
				// this.setState({startSave: false, capitals: [-1, -1]});
				// moved to savemap
			}
			else {
				this.setState({updator: this.state.updator + 1});
			}
			return ;
		}
		this.setState((state) => {
			state.grids[p][q] = this.newGrid();
			return state;
		});
	}
	computeComponents() {
		// find connected components of grid where spawnid is not -1
		this.components = [];
		let visited = [];
		for (let i = 0; i < this.state.row; i++) {
			let row = [];
			for (let j = 0; j < this.state.col; j++) {
				row.push(false);
			}
			visited.push(row);
		}
		for (let i = 0; i < this.state.row; i++) 
			for (let j = 0; j < this.state.col; j++)
				if (this.state.grids[i][j].spawnid != -1)
					this.state.grids[i][j].spawnid = 2;
		for (let i = 0; i < this.state.row; i++) {
			for (let j = 0; j < this.state.col; j++) {
				if (this.state.grids[i][j].spawnid != -1 && !visited[i][j]) {
					let component = [];
					let queue = [];
					queue.push([i, j]);
					while (queue.length > 0) {
						let cur = queue.shift();
						let x = cur[0];
						let y = cur[1];
						if (x < 0 || x >= this.state.row || y < 0 || y >= this.state.col || visited[x][y] || this.state.grids[x][y].spawnid == -1) {
							continue;
						}
						component.push([x, y]);
						visited[x][y] = true;
						queue.push([x - 1, y]);
						queue.push([x + 1, y]);
						queue.push([x, y - 1]);
						queue.push([x, y + 1]);
					}
					this.components.push([component, 0]);
				}
			}
		}
		// update spawnid to be the index of the component
		for (let i = 0; i < this.components.length; i++) {
			for (let j = 0; j < this.components[i][0].length; j++) {
				const x = this.components[i][0][j][0];
				const y = this.components[i][0][j][1];
				this.state.grids[x][y].spawnid = i + 3;
			}
		}
		for (let player = 0; player <= 1; player++) {
			let hu = -1;
			for (let i = 0; i < this.components.length; i++) {
				let ok = false;
				for (let j = 0; j < this.components[i][0].length; j++) {
					const x = this.components[i][0][j][0];
					const y = this.components[i][0][j][1];
					const owner = this.state.grids[x][y].owner;
					if (owner == player) {
						ok = true;
					}
					if (owner == 1 - player) {
						ok = false;
						break;
					}
				}
				if (ok) {
					/*for (let j = 0; j < components[i].length; j++) {
						const x = components[i][j][0];
						const y = components[i][j][1];
						this.state.grids[x][y].spawnid = i + 3;
					}*/
					this.components[i][1] = 1;
					if (hu == -1)
						hu = i;
					else
						hu = -2;
				}
			}
			if (hu != -1) {
				this.state.validCapitalNum++;
			}
			if (hu >= 0) {
				this.state.capitals[player] = hu + 3;
				for (let j = 0; j < this.components[hu][0].length; j++) {
					const x = this.components[hu][0][j][0];
					const y = this.components[hu][0][j][1];
					this.state.grids[x][y].spawnid = player;
				}
			}
		}
	}
	savemap() {
		let data = JSON.stringify(this.state.grids);
		let filename = 'map.json';
		// download data
		let element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
		element.setAttribute('download', filename);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
		this.setState({startSave: false, validCapitalNum: -1, capitals: [-1, -1]});
	}
	save() {
		this.state.validCapitalNum = 0;
		this.state.capitals = [-1, -1];
		this.state.spawnid = -1;
		this.state.level = 0;
		this.state.owner = -1;
		this.state.ontrack = false;
		this.computeComponents();
		console.log(this.state.capitals[0], this.state.capitals[1]);
		if (this.state.capitals[0] != -1 && this.state.capitals[1] != -1) {
			console.log("save");
			this.savemap();
			this.setState({startSave: false, validCapitalNum: -1, capitals: [-1, -1]});
			return ;
		}
		if (this.state.validCapitalNum >= 2)
			this.state.startSave = true;
		this.setState({updator: this.state.updator + 1});
		// save the grid to json file
	}
	handlePropertyChange = (property, val) => {
		if (property == "owner") {
			this.setState({owner: val});
			if (val == 2)
				this.setState({ontrack: 1});
		}
		else if (property == "level") this.setState({level: val});
		else if (property == "spawnid") this.setState({spawnid: val == 0 ? 2 : -1});
		else if (property == "ontrack") this.setState({ontrack: val});
		else if (property == "highlight") this.setState({highlight: val});
	}
	justifySize() {
		while (this.state.grids.length < this.state.row) 
			this.state.grids.push([]);
		while (this.state.grids.length > this.state.row)
			this.state.grids.pop();
		for (let i = 0; i < this.state.grids.length; i++) {
			while (this.state.grids[i].length < this.state.col)
				this.state.grids[i].push(defaultGrid());
			while (this.state.grids[i].length > this.state.col)
				this.state.grids[i].pop();
		}
	}
	changeHandler(event) {
        let outer = this;
        let reader = new FileReader();
        const content = reader.readAsText(event.target.files[0]);
        reader.onload = function (e) {
            let map = JSON.parse(e.target.result);
            if (map == null)
                return ;
            outer.bufferMap = map;
        }
    };
    handleUpload() {
        if (this.bufferMap == null)
            return ;
        console.log("uploading");
		this.state.startSave = false;
		this.state.grids = this.bufferMap;
		this.state.row = this.state.grids.length;
		this.state.col = this.state.grids[0].length;
        this.setState({updator: this.state.updator + 1});
		this.bufferMap = null;
		this.mapSelect = "";
		// change the value of slider

    }
    handleSelect(mapFile) {
        console.log("selecting", mapFile);
        this.mapSelect = mapFile;
		this.state.startSave = false;
        this.state.grids = JSON.parse(JSON.stringify(require("./maps/" + mapFile.value)));
		this.state.row = this.state.grids.length;
		this.state.col = this.state.grids[0].length;
        this.setState({updator: this.state.updator + 1});
		this.bufferMap = null;
    }
	render() {
		const Button = styled.button`
			background-color: white;
			color: black;
			font-size: 20px;
            font-family: "IBM Plex Sans", sans-serif;
            font-weight: 700;
			padding: 10px 30px;
			border-radius: 0px;
			margin: 10px 0px;
			cursor: pointer;
		`;
		let uploadExisting =  (<div style={{display:"flex", flexDirection:"column", marginTop:"25px"}}>
			<input type="file" name="file" onChange={this.changeHandler}/>
            <Button onClick={this.handleUpload}>Upload Existing Map</Button>
			</div>);
		console.log(this.state.capitals);
		this.justifySize();
		const selects = [];
		// let description = ["Player", "Piece", "Capital? [y/n]", "On track of NPC? [y/n]"]
		let properties = ["owner", "level", "spawnid", "ontrack"];
		let range = [[-1, 2], [0, 3], [-1, 0], [0, 1], [0, 1]]; // -1 ~ i
		for (let i = 0; i < properties.length; i++) {
			let options = [];
			//options.push(description[i])
			let l = range[i][0], r = range[i][1];
			if (properties[i] == "level" && this.state.owner != 0 && this.state.owner != 1)
				r = l;
			for (let j = l; j <= r; j++) {
				//let owner = this.state.owner, level = this.state.level, spawnid = this.state.spawnid, ontrack = this.state.ontrack;
				let owner = -1, level = -1, spawnid = -1, ontrack = 0, text = "";
				if (properties[i] == "level") {owner = this.state.owner == -1 ? 0: this.state.owner};
				let highlight = false;
				if (properties[i] == "owner") {
					owner = j;
					highlight = (j == this.state.owner);
				}
				if (properties[i] == "level") {
					level = j;
					if (this.state.owner == -1){
						level = -1;
						owner = -1;
					}
					highlight = (j == this.state.level);
				}
				if (properties[i] == "spawnid") {
					if (j == 0) {
						spawnid = 2;
						highlight = (2 == this.state.spawnid);
						text = "√";
					}
					else {
						spawnid = -1;
						highlight = (-1 == this.state.spawnid);
						text = "×";
					}
				}
				if (properties[i] == "ontrack") {
					ontrack = j;
					highlight = (j == this.state.ontrack);
					text = (j == 1 ? "√" : "×");
				}
				if (l == r)
					highlight = true;
				options.push(<div /*style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}*/>
					
					<div style={{filter: !highlight
								? "brightness(0.6)"
								: "brightness(1)"}}><Grid 
						key={j}
						owner={owner}
						level={level}
						moved={false}
						spawnid={spawnid}
						ontrack={ontrack}
						highlight={properties[i] == "highlight" && j}
						hidden={false}
						text={text}
						onClick = {() => {if (!this.state.startSave) {this.handlePropertyChange(properties[i], j)} }}
					/></div>
				</div>
				);
			}
			selects.push(
				<div key={i} className="Board-row">{options}</div>);
			selects.push(
				<div style={{lineHeight: "10px"}}><br></br></div>)
		}

		let propertySelection = 
		<div>
			<div style={{marginTop: "25px", fontStyle: "italic", marginBottom: "-5px"}}>
					Select each attribute to define your piece  <br></br> & draw your map with the result!
			</div>
			<div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start"}}>
				<div style={{marginTop:"30px", display: "flex", flexDirection: "column",  alignItems: "flex-start"}}>
					<div style={{}}>
						Player
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						None / Red / Purple / NPC
					</div>
					<div style={{fontFamily: "IBM Plex Sans", fontWeight: "light"}}>
						Piece
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						{this.state.owner < 0 ? "Empty grid" : this.state.owner <= 1 ? "Pawn / Archer / Knight / Cannon" : "NPC"}
					</div>
					<div style={{}}>
						City or not
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						{"Current state: " + (this.state.spawnid == 2 ? "City" : "Not a City")}
					</div>
					<div style={{}}>
						On track
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						{"Current state: " + (this.state.ontrack == 1 ? "On track" : "Not on track")}
					</div>
					<div style={{fontSize:"28px", lineHeight:"36px", paddingTop: "13px", fontWeight: "bold"}}>
						Result
					</div>
					
				</div>
				<div className="Board" style={{marginLeft:"10px", marginTop:"30px"}}>
					{selects}
				</div>
			</div>
		</div>
		const result = 
			
		<div className="Board-row">
			<Grid
			owner={this.state.owner} 
			level={this.state.level}
			moved={false}
			spawnid={this.state.spawnid}
			ontrack={this.state.ontrack}
			highlight={this.state.highlight}
			hidden={false}
			text={this.state.startSave ? "🏰" : ""}
			/>
		</div>;

		const ths = this;
		selects.push(<div style={{lineHeight: "10px"}}><br></br></div>)
		selects.push(result);

        let options = [];
        for (let i = 0; i < mapList.length; i++) {
            options.push({value: mapList[i][1], label: mapList[i][0]});
        }
		return (
			<div style={{fontSize:"20px", textAlign:"center"}}>
			<NavigateBar/>
			<AccountBar/>
			<div style={{display:"flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
				<div className="m-4">
					Draw a new map or edit map files!
				</div>
				<div style={{width: "min(80%, max(20%, 300px))"}}>
					<Select
						value={this.mapSelect}
						onChange={this.handleSelect}
						options={options}
						isSearchable={false}>
					</Select>
					{uploadExisting}
				</div>
			<div style={{display:"flex", width:"40%", padding:"20px", flexDirection: "column", justifyContent: "flex-start ", alignItems: "center"}}>
				<Typography id="row-slider" fontFamily={"IBM Plex Sans"} gutterBottom>
					Rows
				</Typography>
				<Slider
					aria-labelledby="row-slider"
					color= "secondary"
					key={`slider-row-${this.state.row}`}
					// orientation='vertical'
					defaultValue={this.state.row}
					valueLabelDjustisplay="auto"
					step={1}
					marks
					min={3}
					max={20}
					onChange={(e, val) => {this.setState({row: val})}}
				/>

				<Typography id="col-slider"fontFamily={"IBM Plex Sans"} fontWeight={"500"} gutterBottom>
					Columns
				</Typography>
				<Slider
					aria-labelledby="col-slider"
					// orientation='vertical'
					key={`slider-col-${this.state.col}`}
					defaultValue={this.state.col}
					valueLabelDisplay="auto"
					step={1}
					marks
					min={3}
					max={20}
					onChange={(e, val) => {this.setState({col: val})}}
				/>
				</div>
				<div className="Board" style={{display:"flex", flexDirection:"column", marginTop: "20px"}}>
					{this.state.grids.map((row, i) => (
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
									highlight={this.state.startSave ? (grid.spawnid != -1 && this.state.capitals.indexOf(grid.spawnid) != -1) : grid.highlight}
									hidden={false}
									onClick={() => ths.handleClick(i, j)}
								/>
							))}
						</div>
					))}
				</div>
				<div style={{display:"flex", flexDirection:"column", justifyContent: "space-between"}}>
					
					{propertySelection}
					
				</div>

			</div>
			
			<div style={{fontSize:"30px", fontWeight:"bold", color:"red", padding:"10px"}}>{(this.state.startSave ? "Please select Capitals (Click the piece in board)" : this.state.validCapitalNum >= 0 && this.state.validCapitalNum < 2 ? "Invalid Map (Both player should possess a City)" : "")}</div>
			
			<Button style={{marginBottom: "50px", padding:"10px 60px"}} onClick={this.save}>Save</Button>
			</div>
		);
	}
}
export default withRouter(Mapdrawer);
