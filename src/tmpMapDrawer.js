import './Board.css';
import Grid from './Grid.js';
import React, { Component } from "react";
import { render } from "react-dom";
//use react slider

import styled from "styled-components";
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';

import NavigateBar from './NavigateBar';
import {bind} from './socketListeners';
import {withRouter }from './withRouter.js';

// create class board and render it
function defaultGrid() {
	return {
		owner: -1, 
		level: -1,
		spawnid: -1,
		ontrack: 0, 
        hidden: false,
        moved: false,
		highlight: false,
		text: ""
	};
}
class TmpMapdrawer extends React.Component {
	// whose turn
	constructor(props) {
		console.log("Hello from tmpMapdrawer constructor");
		super(props);
		bind.call(this);
		let info = [];
		const row = 10, col = 10;
		for (let i = 0; i < row; i++) {
			let rowinfo = [];
			for (let j = 0; j < col; j++) 
				rowinfo.push(defaultGrid());
			info.push(rowinfo);
		}
		this.state = {
			spawnid: -1,
			owner: -1,
			level: 0,
			row: row, 
			col: col,
			ontrack: 0,
            hidden: false,
            moved: false,
			text: "",
			grids: info,
			highlight: false, 
			startSave: false, 
			capitals: [-1, -1], 
			updator: 0
		};	
		this.bufferMap = null;
		//binds functions
		this.newGrid = this.newGrid.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.computeComponents = this.computeComponents.bind(this);
		this.handlePropertyChange = this.handlePropertyChange.bind(this);
		this.handleUpload = this.handleUpload.bind(this);
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
            hidden: this.state.hidden,
            moved: this.state.moved,
			text: this.state.text,
			highlight: this.state.highlight
		};
	}

	handleClick(i, j) {
		if (this.state.startSave) {
            this.savemap();
            this.setState({startSave: false, capitals: [-1, -1]});
			/*let owner = this.state.grids[i][j].owner;
			let spawnid = this.state.grids[i][j].spawnid;
			if (owner < 0 || owner >= 2) return ;
			this.state.capitals[owner] = spawnid;
			this.setState({updator: this.state.updator + 1});
			if (this.state.capitals[0] != -1 && this.state.capitals[1] != -1) {
				for (let i = 0; i < this.state.row; i++) 
					for (let j = 0; j < this.state.col; j++) {
						let grid = this.state.grids[i][j];
						if (grid.spawnid == this.state.capitals[0]) grid.spawnid = 0;
						if (grid.spawnid == this.state.capitals[1]) grid.spawnid = 1;
					}
				this.savemap();
				this.setState({startSave: false, capitals: [-1, -1]});
			}*/
			return ;
		}
		this.setState((state) => {
			state.grids[i][j] = this.newGrid();
			return state;
		});
	}
	computeComponents() {
		// find connected components of grid where spawnid is not -1
		let components = [];
		let visited = [];
		for (let i = 0; i < this.state.row; i++) {
			let row = [];
			for (let j = 0; j < this.state.col; j++) {
				row.push(false);
			}
			visited.push(row);
		}
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
					components.push(component);
				}
			}
		}
		// update spawnid to be the index of the component
		for (let i = 0; i < components.length; i++) {
			for (let j = 0; j < components[i].length; j++) {
				let x = components[i][j][0];
				let y = components[i][j][1];
				this.state.grids[x][y].spawnid = i + 2;
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

	}
	save() {
		this.savemap();
		//this.computeComponents();
		//this.setState({startSave: true, capitals: [-1, -1]});
		// save the grid to json file
	}
	handlePropertyChange = (property, val) => {
		if (property == "owner") this.setState({owner: val});
		else if (property == "level") this.setState({level: val});
		else if (property == "spawnid") this.setState({spawnid: val == 0 ? 2 : -1});
		else if (property == "ontrack") this.setState({ontrack: val});
		else if (property == "hidden") this.setState({hidden: val});
		else if (property == "moved") this.setState({moved: val});
		else if (property == "highlight") this.setState({highlight: val});
		else if (property == "text") this.setState({text: val});
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
		// change the value of slider

    }
	render() {
		const Button = styled.button`
			background-color: white;
			color: black;
			font-size: 20px;
            font-family: "IBM Plex Sans", sans-serif;
            font-weight: 700;
			padding: 10px 60px;
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
		let properties = ["owner", "level", "spawnid", "ontrack", "hidden", "highlight", "moved"];
		let range = [[-1, 2], [0, 3], [-1, 0], [0, 1], [0, 1], [0, 1], [0, 1], [0, 1]]; // -1 ~ i
		for (let i = 0; i < properties.length; i++) {
			let options = [];
			//options.push(description[i])
			for (let j = range[i][0]; j <= range[i][1]; j++) {
				//let owner = this.state.owner, level = this.state.level, spawnid = this.state.spawnid, ontrack = this.state.ontrack;
				let owner = -1, level = -1, spawnid = -1, ontrack = 0, hidden = false, chosen = false, moved = false;
				if (properties[i] == "level") owner = this.state.owner == -1 ? 0: this.state.owner;
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
					spawnid = (j == 0 ? 2 : -1);
					highlight = ((j == 0 ? 2 : -1) == this.state.spawnid);
				}
				if (properties[i] == "ontrack") {
					ontrack = j;
					highlight = (j == this.state.ontrack);
				}
				if (properties[i] == "hidden") {
					hidden = j;
					highlight = (j == this.state.hidden);
				}
				if (properties[i] == "chosen") {
					chosen = j;
					highlight = (j == this.state.chosen);
				}
				if (properties[i] == "moved") {
					moved = j;
					highlight = (j == this.state.moved);
				}
				options.push(<div /*style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}*/>
					
					<div style={{filter: !highlight
								? "brightness(0.7)"
								: "brightness(1)"}}><Grid 
						key={j}
						owner={owner}
						level={level}
						moved={moved}
						spawnid={spawnid}
						ontrack={ontrack}
						highlight={chosen}
						hidden={hidden}
						onClick = {() => this.handlePropertyChange(properties[i], j)}
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
						Pawn / Archer / Knight / Tank or NPC
					</div>
					<div style={{}}>
						City or not 
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						No: white / Yes: yellow
					</div>
					<div style={{}}>
						On track
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						If on the track of NPC. No / Yes: boxed
					</div>
					<div style={{}}>
						Hidden
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						No / Yes
					</div>
					<div style={{}}>
						Highlight
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						No / Yes
					</div>
					<div style={{}}>
						Moved
					</div>
					<div style={{fontSize:"10px", fontStyle: "italic", paddingBottom: "5px"}}>
						No / Yes
					</div>
					<input type="text" onChange={(e)=>{this.setState({text: e.target.value});console.log(this.state.text)}}/>
					<div style={{lineHeight:"36px", paddingTop: "10px", fontWeight: "bold"}}>
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
			moved={this.state.moved}
			spawnid={this.state.spawnid}
			ontrack={this.state.ontrack}
			highlight={this.state.highlight}
			hidden={this.state.hidden}
			text={this.state.text}
			/>
		</div>;

		const ths = this;
		selects.push(<div style={{lineHeight: "10px"}}><br></br></div>)
		selects.push(result);
		return (
			<div style={{fontSize:"20px", textAlign:"center"}}>
			<NavigateBar/>
			<div style={{display:"flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
				<div style={{display:"flex", width:"40%", padding:"60px", flexDirection: "column", justifyContent: "flex-start ", alignItems: "center"}}>
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
					max={25}
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
					max={25}
					onChange={(e, val) => {this.setState({col: val})}}
				/>
				</div>
				<div className="Board" style={{display:"flex", flexDirection:"column", marginTop: "-20px"}}>
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
									spawnid={grid.spawnid}
									ontrack={grid.ontrack}
									highlight={this.state.startSave ? (grid.spawnid != -1 && (this.state.capitals.indexOf(grid.spawnid) != -1)) : grid.highlight}
									hidden={grid.hidden}
									text={grid.text}
									onClick={() => ths.handleClick(i, j)}
								/>
							))}
						</div>
					))}
				</div>
				<div style={{display:"flex", flexDirection:"column", justifyContent: "space-between"}}>
					
				{uploadExisting}
					{propertySelection}
					
				</div>

			</div>
			
			<div style={{fontSize:"30px", fontWeight:"bold", color:"gold", padding:"10px"}}>{(this.state.startSave ? "Please select Capitals..." : "")}</div>
			
			<Button onClick={this.save}>Save</Button>
			</div>
		);
	}
}
export default withRouter(TmpMapdrawer);
