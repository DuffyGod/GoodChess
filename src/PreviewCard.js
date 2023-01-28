import React, { Component } from 'react';
import { Route, Routes } from 'react-router-dom';
import './PreviewCard.css';

export default function Previewcard(props) {
    const joinRoom = () => {
        // add room to cookies
        window.socket.emit('join room', props.room);
    };
  return (
    <>
      <div className={"rounded border-1 pt-2 cursor-pointer mycard " + "greenlayer"} onClick={joinRoom}>
        <div className="flex row flex-wrap justify-between align-end">
        <div style={{maxWidth: "max(40%, 100px)", display: "flex", flexDirection: "row", justifyContent:"space-between"}}>
            <div className="text-2xl">
              <span style={{fontWeight:"600"}} className="Rashi">
              {props.room + (props.started ? (props.canSpectate ? "\xa0\xa0👁" : "\xa0\xa0🔒") : "")}
              </span>
            </div>
            <div className="text-right mb-2 flex-grow">
              {props.users.length + " / 2"}
            </div>
        </div>
        </div>
        {/* <span className="text-lg ml-1">
        {props.description}
        </span> */}
      </div>
      <hr width style={{margin:"0.2rem 0rem"}}></hr>
    </>
  );
}