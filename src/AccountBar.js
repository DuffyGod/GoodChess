import React, { useState, useEffect } from "react";
import "./AccountBar.css";
import { Link, useNavigate } from "react-router-dom";
import Cookies from 'universal-cookie';

function AccountBar(props) {
    let userinfo = <span className="accbar-text"><em>♙</em>Log In</span>;
    const cookies = new Cookies();
    let username = cookies.get('info/username');
    let password = cookies.get('info/password');
    if (username && password) {
        userinfo = <span className="accbar-text"><em>♔</em>{username}</span>;
    }
    return (
        <div className="accbar">
            <div className="accbar-banner">
                <Link to="/account" className="link">
                    {userinfo}
                </Link>
            </div>
        </div>
    );
}
export default AccountBar;