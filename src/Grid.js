import logo from './logo.svg';
import './Grid.css';
import React, { Component } from "react";
import { render } from "react-dom";
import {LEVEL} from "./levels.js";

// props: 
//     level (0, 1, 2, 3) (3 : tower)
//     owner (0, 1: player; -1: empty, 2: computer)
//     moved : boolean
export function convertColor(owner) {
	if (owner == 0) {
		return "rgb(250, 64, 5)";
	} else if (owner == 1) {
		return "rgb(166, 4, 223)";
	} else if (owner == 2) {
		return "rgb(58, 210, 4)"; // 3DDF04
	} else {
		return "rgb(128, 128, 128)";
	}
}

class Grid extends React.Component {
  constructor(props) {
    super(props);
    // bind functions
    // this.convertColor = this.convertColor.bind(this);
    this.mapContent = this.mapContent.bind(this);
  }
  mapContent(level) {
	if (level == -1) return "";
    if (level == LEVEL.ARCHER) return "➳";
    else if (level == LEVEL.KNIGHT) return "♞";
    else if (level == LEVEL.PAWN) return "🗡";
    else if (level == LEVEL.CANNON) return "💣";
	else if (level == LEVEL.ASSASSIN) return "⇝"; // gun
	else if (level == LEVEL.ROOK) return "♜";
	else if (level == LEVEL.ARMEDROOK) return "✠";
    else return "🕊";
	// an emoji of gun
	return ""
  }

  render() {
	let item = this.props.owner != -1 ? (
				<div
					className="Grid-item"
					style={{
						backgroundColor: convertColor(this.props.owner),
						filter: this.props.moved
							? "brightness(0.85)"
							: "brightness(1)",
					}} >
					{this.props.owner == 2 ? "":this.mapContent(this.props.level)}
				</div>
			) : typeof this.props.text != "undefined" && this.props.text.length > 0 ? <div className="Grid-item" style={{color: "black", fontSize: "20px"}}>{this.props.text}</div> : "";
	if (this.props.hidden)
		item = null;
	let rgbColor = convertColor(this.props.spawnid);
	let rgbaColor = rgbColor.replace(")", ", 0.3)").replace("rgb", "rgba");
	let backgroundColor = (/*!this.props.hidden &&*/ this.props.highlight)
	? "rgb(250,250,250)"
	: this.props.spawnid == -1 ? "rgb(230, 230, 230)" : 
		(this.props.spawnid == 0 || this.props.spawnid == 1) ? rgbaColor 
		: "#f6e59d";
  return (
		<div
			className="Grid"
			onClick={this.props.onClick}
			style={{
				backgroundColor: backgroundColor,
					filter: (this.props.hidden ? "brightness(0.8)" : "brightness(1)")
							+ (this.props.ontrack ? "contrast(0.96)" : "contrast(1)") ,

        border: this.props.ontrack
          ? "1.5px solid " + "#04AADF"
          : "1.5px solid white"
			}}
		>
			{item}
		</div>
  );
        }
}

export default Grid;
// #00a3ff