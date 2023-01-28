import React, { Component } from "react";
// router
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { render } from "react-dom";
import styled, { ThemeProvider } from "styled-components";
import Cookies from 'universal-cookie';
import { withRouter } from './withRouter.js';
import { useNavigate } from 'react-router-dom';
import NavigateBar from "./NavigateBar.js";
import { minWidth } from "@mui/system";
import { bind } from './socketListeners.js';
import { cipher } from './cipher.js';
import Button from "react-bootstrap/Button";

//import "./Account.css";

class Account extends React.Component {
    constructor(props) {
        super(props);
        bind.call(this);
        this.state = {
            waiting: false,
            username: "",
            password: "",
            isRegister: false,
            confirmPassword: "",
            phoneNumber: "",
            newPassword: "",
            remark: ""
        }
        // bind
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.editPassword = this.editPassword.bind(this);
    }
    reloadPage() {
        window.location.reload();
    }
    removeCookie() {
        const cookies = new Cookies();
        // delete username and password in cookies
        cookies.remove('user', { path: '/' });
        cookies.remove('info/username', { path: '/' });
        cookies.remove('info/password', { path: '/' });
    }
    register() {
        if (this.state.waiting) return;
        console.log("register");
        if (!this.state.isRegister) {
            this.setState({ remark: "", isRegister: true });
            return;
        }
        if (this.state.username.length < 3) {
            console.log("too short");
            this.setState({ remark: "Username must be at least 3 characters long" });
            return;
        }
        if (this.state.password.length < 4) {
            console.log("too short");
            this.setState({ remark: "Password must be at least 4 characters long" });
            return;
        }
        if (this.state.password != this.state.confirmPassword) {
            console.log("passwords don't match");
            this.setState({ remark: "Passwords don't match" });
            return;
        }
        const cookies = new Cookies();
        const username = this.state.username;
        const password = cipher(this.state.password);
        this.state.waiting = true;
        this.setState({ remark: "Connecting..." });
        window.socket.emit('create user', {
            username: username,
            password: password,
            phoneNumber: this.state.phoneNumber
        },
            (succeed, accountID) => {
                if (succeed) {
                    console.log("register successful");
                    this.setState({ remark: "Successfully registered! Redirecting..." });
                    setTimeout(() => {
                        cookies.set('user', accountID, { path: '/' });
                        cookies.set('info/username', username, { path: '/' });
                        cookies.set('info/password', password, { path: '/' });
                        this.reloadPage();
                    }, 1500);
                }
                else {
                    this.state.waiting = false;
                    console.log("register failed");
                    if (accountID > 0)
                        this.setState({ remark: "Please log in" });
                    else
                        this.setState({ remark: "Username already exists" });
                }
            });
    }
    login() {
        if (this.state.waiting) return;
        console.log("login");
        if (this.state.isRegister) {
            this.setState({ isRegister: false });
            //return ;
        }
        const username = this.state.username;
        const password = cipher(this.state.password);
        this.state.waiting = true;
        this.setState({ remark: "Connecting..." });
        window.socket.emit('login', { username: username, password: password },
            (accountID) => {
                if (accountID > 0) {
                    console.log("login successful");
                    this.setState({ remark: "Successfully logged in! Redirecting..." });
                    const cookies = new Cookies();
                    setTimeout(() => {
                        cookies.set('user', accountID, { path: '/' });
                        cookies.set('info/username', username, { path: '/' });
                        cookies.set('info/password', password, { path: '/' });
                        this.reloadPage();
                    }, 1500);
                }
                else {
                    this.state.waiting = false;
                    console.log("login failed");
                    if (accountID == -1) // doesn't exist
                        this.setState({ remark: "Username doesn't exist" });
                    else if (accountID == -2) // incorrect password
                        this.setState({ remark: "Incorrect password", password: "" });
                    else
                        this.setState({ remark: "Unknown error" });
                }
            });
    }
    editPassword() {
        if (this.state.waiting) return;
        console.log("edit password");
        if (this.state.newPassword.length < 4) {
            console.log("too short");
            this.setState({ remark: "New password must be at least 4 characters long" });
            return;
        }
        const cookies = new Cookies();
        const username = cookies.get('info/username');
        const password = cipher(this.state.password);
        const newPassword = cipher(this.state.newPassword);
        this.state.waiting = true;
        this.setState({ remark: "Connecting..." });
        window.socket.emit('edit password', { username: username, password: password }, newPassword,
            (succeed) => {
                this.state.waiting = false;
                if (succeed) {
                    console.log("edit password successful");
                    // reset password
                    this.setState({
                        remark: "Successfully changed password!",
                        password: "",
                        newPassword: ""
                    });
                    cookies.set('info/password', newPassword, { path: '/' });
                    //this.reloadPage();
                }
                else {
                    console.log("edit password failed");
                    this.setState({
                        remark: "Incorrect password",
                        password: ""
                    });
                }
            });
    }

    render() {
        const cookies = new Cookies();
        let username = cookies.get('info/username');
        let password = cookies.get('info/password');

        const inputClass = "text-3xl border-b-2 p-1 m-auto my-1";
        const inputStyle = { width: "min(max(30%,300px),100%)" };
        const buttonClass = "m-auto mt-2 mb-2";
        const usernameInput = <input type="text" placeholder="Username"
            className={inputClass}
            value={this.state.username}
            minLength="3"
            maxLength="16"
            style={inputStyle}
            onChange={(e) => { this.setState({ remark: "", username: e.target.value }); }} />
        const passwordInput = <input type="password" placeholder="Password"
            className={inputClass}
            value={this.state.password}
            minLength="4"
            maxLength="20"
            style={inputStyle}
            onChange={(e) => { this.setState({ remark: "", password: e.target.value }); }} />
        const confirmPasswordInput = <input type="password" placeholder="Confirm Password"
            className={inputClass}
            value={this.state.confirmPassword}
            minLength="4"
            maxLength="20"
            style={inputStyle}
            onChange={(e) => { this.setState({ remark: "", confirmPassword: e.target.value }); }} />
        const newPasswordInput = <input type="password" placeholder="New Password"
            className={inputClass}
            value={this.state.newPassword}
            minLength="4"
            maxLength="20"
            style={inputStyle}
            onChange={(e) => { this.setState({ remark: "", newPassword: e.target.value }); }} />
        const phoneNumberInput = <input type="tel" placeholder="Phone Number"
            className={inputClass}
            value={this.state.phoneNumber}
            minLength="11"
            maxLength="11"
            style={inputStyle}
            onChange={(e) => { this.setState({ remark: "", phoneNumber: e.target.value }); }} />
        let inputList = [];
        let buttonList = [];
        let title = <h1 style={{ textAlign: "center" }}>Account</h1>;
        if (username !== undefined && password !== undefined) {
            // modify info
            title = <>
                <h1 style={{ textAlign: "center" }}>Update Info</h1>
                <div style={{ fontSize: "32px", padding: "5px", textAlign: "center" }}>{"Username: " + username}</div>
            </>;
            inputList.push(passwordInput);
            inputList.push(newPasswordInput);
            buttonList.push(
                <Button variant="outline-primary"
                    className={buttonClass}
                    size="lg"
                    style={{ width: "min(max(20%,300px),100%)" }}
                    onClick={this.editPassword}>Edit Password</Button>
            );
            buttonList.push(
                <Button variant="outline-primary"
                    className={buttonClass}
                    size="lg"
                    style={{ width: "min(max(20%,300px),100%)" }}
                    onClick={() => { this.removeCookie(); this.reloadPage(); }}>Log Out</Button>
            );
        }
        else {
            // log in
            title = <>
                <h1 style={{ textAlign: "center" }}>Log In</h1>
            </>;
            inputList.push(usernameInput);
            inputList.push(passwordInput);
            if (this.state.isRegister) {
                inputList.push(confirmPasswordInput);
                inputList.push(phoneNumberInput);
            }
            buttonList.push(
                <Button variant="outline-primary"
                    className={buttonClass}
                    size="lg"
                    style={{ width: "min(max(15%,200px),100%)" }}
                    onClick={this.login}>Login</Button>
            );
            buttonList.push(
                <Button variant="outline-primary"
                    className={buttonClass}
                    size="lg"
                    style={{ width: "min(max(15%,200px),100%)" }}
                    onClick={this.register}>Register</Button>
            );
        }
        return (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <NavigateBar />
                {title}
                <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    {inputList}

                    <p className="text-center m-2" style={{ color: "red", fontSize: "24px" }}>{this.state.remark}</p>

                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {buttonList}
                    </div>
                </div>
            </div>);

    }
}

export default withRouter(Account);