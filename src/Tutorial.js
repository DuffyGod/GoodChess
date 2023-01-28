import React, { Component } from "react";
// router
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { render } from "react-dom";
import styled from "styled-components";
import Cookies from 'universal-cookie';
import { withRouter }from './withRouter.js';
import { useNavigate } from 'react-router-dom';
import NavigateBar from "./NavigateBar.js";
import AccountBar from './AccountBar';
import Grid from './Grid.js';
import { minWidth } from "@mui/system";
import { bind } from './socketListeners.js';
import './Grid.css';
import './Board.css';
import "./Tutorial.css";

const languageList = ["中文", "English"];
//const tutorialMapList = [["Troops", "tutor1.json"], ["Cannon", "tutor2.json"], ["Neutral", "tutor3.json"]];

class Tutorial extends React.Component {
    constructor(props) {
        super(props);
        bind.call(this);
        this.state = {
            lanType: 0,
            prei: 0,
            i: -1,
            j: 0,
            k: 0
        }
        this.info = [];
        for (let i = 0; i < languageList.length; i++) {
            this.info.push(JSON.parse(JSON.stringify(require("./tutorial/" + languageList[i] + ".json"))));
            //console.log(this.info[i]);
        }
        /*this.dic = new Array();
        let w = this.info[this.state.lanType];
        for (let i = 0; i < w.length; i++) {
            let u = w[i].entry;
            for (let j = 0; j < u.length; j++) {
                let v = u[j].entry;
                for (let k = 0; k < v.length; k++) {
                    if (v[k].type == "pic" && !(v[k].url in this.dic)) {
                        console.log("pic add: ", v[k].url);
                        this.dic[v[k].url] = <img src={require("./tutorial/pics/" + v[k].url + ".png")}/>;
                    }
                }
            }
        }*/
    }
    createPageByString(info, isBig = true) {
        info = info.replaceAll("$chess", "style=\"font-family: 'Noto Sans Symbols 2', '宋体'\"");
        if (isBig)
            return <div className="Introduction" dangerouslySetInnerHTML={{__html:info}}></div>;   
        else
            return <div className="Illustration" dangerouslySetInnerHTML={{__html:info}}></div>;   
    }
    createTutorialPage(info) {
        const Button = styled.button`
			background-color: white;
			color: black;
            font-family: IBM Plex Sans;
            font-weight: bold;
			font-size: 20px;
			padding: 10px 10px;
			border-radius: 5px;
			margin: 0px 10px;
            text-align: center;
            width: 160px;
			cursor: pointer;
		`;
        const ButtonGroup = styled.div`
        display: flex
        `
        let languageButtons = [];
        for (let i = 0; i < languageList.length; i++) {
            languageButtons.push(
                <Button onClick={()=>{this.setState({lanType: i})}}>
                    {languageList[i]}
                </Button>
            );
        }
        const isHeigthEnough = (document.documentElement.clientHeight > 850);
        return (
            <div className="Tutorial">
                <NavigateBar/>
                <AccountBar/>
                <div style={{marginLeft:"70px", display:"flex", flexDirection: "column", alignItems:"center"}}>
                    <ButtonGroup style={{marginTop:"20px", flexDirection: "row"}}>
                        {languageButtons}
                    </ButtonGroup>
                    <div style={{height: isHeigthEnough ? "750px" : "500px", marginTop:"20px", display:"flex", flexDirection: "row", justifyContent:"center"}}>
                        {info}
                    </div>
                </div>
            </div>
        )
    }
    render() {
        if (this.state.i < 0) {
            const Button = styled.button`
			background-color: white;
			color: black;
			font-size: 32px;
            font-family: "IBM Plex Sans", sans-serif;
            font-weight: 800;
            width: 250px;
			padding: 25px 15px;
			border-radius: 0px;
			margin: -1px 0px;
			cursor: pointer;
		    `;
            const ButtonGroup = styled.div`
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 250px;
            `;
            let cur = this.info[this.state.lanType];
            let buttons = [];
            for (let i = 0; i < cur.length; i++) {
                buttons.push(
                    <Button onClick={()=>{if (this.state.i != i) { this.setState({i: i}); } }} onMouseOver={()=>{if (this.state.prei != i) { this.setState({prei: i}); } }}>
                        {i == this.state.prei ? (<i>{cur[i].brief}</i>) : cur[i].brief}
                    </Button>
                );
            }
            let text = this.createPageByString(cur[this.state.prei].page, true);
            let page = <div style={{width:"850px", display:"flex", flexDirection:"row", justifyContent:"flex-start", alignItems:"center"}}>
                <ButtonGroup>{buttons}</ButtonGroup>
                {text}
            </div>;
            return this.createTutorialPage(page);
        }
        else {
            const PageBar = styled.div`
            display: flex;
            justify-content: center;
            align-items: center;
            background:  "palevioletred";
            color: black;
            font-size: 2.5em;
            font-family: Consolas;
            border: 2px solid;
            border-radius: 0px;
            border-color: #ffffff;
            width: 100px;
            height: 70px;
            background-color: #ffffff;
            `;
            const PageButton = styled.button`
            background:  "palevioletred";
            color: black;
            font-size: 2.5em;
            font-family: IBM Plex Sans;
            font-weight: bold;
            margin: 0em;
            padding: 0em 1em;
            border: 2px solid;
            border-radius: 0px;
            border-color: #ffffff;
            width: 120px;
            height: 70px;
            background-color: #ffffff;
            `;
            const Button = styled.button`
			background-color: white;
			color: black;
			font-size: 24px;
            font-family: "楷体", "IBM Plex Sans", sans-serif;
            font-weight: 600;
            width: 180px;
			padding: 15px 15px;
			border-radius: 0px;
			margin: -1px 0px;
			cursor: pointer;
		    `;
            const ButtonGroup = styled.div`
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 180px;
            `;
            let cur = this.info[this.state.lanType][this.state.i].entry;
            let curpage = cur[this.state.j].entry[this.state.k];
            let buttons = [];
            for (let j = 0; j < cur.length; j++) {
                buttons.push(
                    <Button onClick={()=>{ if (this.state.j != j) { this.setState({j: j, k: 0}); } }}>
                        {j == this.state.j ? "- " + cur[j].brief + " -" : cur[j].brief}
                    </Button>
                );
            }
            let board = <div></div>;
            console.log(this.state, curpage.type);
            if (curpage.type == "map") {
                const mapInfo = JSON.parse(JSON.stringify(require("./tutorial/maps/" + curpage.url + ".json")));
                board = <div className="Board" style={{margin: "0px 10px", width: "350px"}}> {
                    mapInfo.map((row, i) => (
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
                                highlight={grid.highlight}
                                hidden={grid.hidden}
                                text={typeof grid.text != "undefined" ? grid.text : ""}
                            />
                        ))}
                    </div>
                ))}
                </div>
            }
            else {
                /*if(!(curpage.url in this.dic))
                    this.dic[curpage.url] = <img src={require("./tutorial/pics/" + curpage.url + ".png")}/>;
                let p = this.dic[curpage.url];*/
                let p = <img src={JSON.parse(JSON.stringify(require("./tutorial/pics/" + curpage.url + ".png")))}/>;
                board = <div style={{margin: "0px 10px", width: "350px", display:"flex", flexDirection:"row", justifyContent:"center"}}>
                            {p}
                        </div>;
            }
            const jlen = cur.length;
            const klen = cur[this.state.j].entry.length;
            let actionBar = <div style={{position:"absolute", bottom:"-50px", display:"flex", flexDirection:"row", justifyContent:"center"}}>
                <PageButton onClick={() => {
                    if (this.state.k == 0) {
                        if (this.state.j > 0) {
                            this.state.j--;
                            this.state.k = cur[this.state.j].entry.length - 1;
                            this.setState({updator: this.state.updator + 1});
                        }
                    }
                    else
                        this.setState({k: this.state.k - 1});
                }}>{this.state.k > 0 ? "‹" : this.state.j > 0 ? "‹‹" : "-"}</PageButton>
                <PageBar>
                    {(this.state.k + 1) + "/" + klen}
                </PageBar>
                <PageButton onClick={() => {
                    if (this.state.k == klen - 1) {
                        if (this.state.j < jlen - 1)
                            this.setState({j: this.state.j + 1, k: 0});
                    }
                    else
                        this.setState({k: this.state.k + 1});
                }}>{this.state.k < klen - 1 ? "›" : this.state.j < jlen - 1 ? "››" : "-"}</PageButton>
                <PageButton onClick={() => {
                    this.setState({
                        i: -1,
                        j: 0,
                        k: 0
                    });
                }}>{"⮌"}</PageButton>
            </div>;
            const isHeigthEnough = (document.documentElement.clientHeight > 850);
            let text = this.createPageByString(cur[this.state.j].entry[this.state.k].page, false);
            let page = <div style={{width:"900px", display:"flex", flexDirection:"row", justifyContent:"flex-start", alignItems:"center"}}>
                <ButtonGroup>{buttons}</ButtonGroup>
                <div style={{height:isHeigthEnough?"700px":"450px", position:"relative", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center"}}>
                    <div style={{display:"flex", flexDirection:"row", justifyContent:"flex-start", alignItems:"center"}}>
                        {board}
                        {text}
                    </div>
                    {actionBar}
                </div>
            </div>;
            return this.createTutorialPage(page);
        }
    }
}

export default withRouter(Tutorial);