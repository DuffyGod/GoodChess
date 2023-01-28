const express = require("express");
const app = express();
const port = 3005;
const cors = require('cors');
app.use(cors());


const server = app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});


// add socket for games

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
	},
});

// import
//import {LEVEL} from "../src/levels.js";

// database
const path = require('path');
const CryptoJS = require("crypto-js");
const User = require('./User.js');
app.use(express.static(path.join(__dirname, 'client/build')));
const mongoURL = "mongodb+srv://Goodeat:FRLBiDRs00lDEOAP@goodeat.gkwpiij.mongodb.net/?retryWrites=true&w=majority"
const mongoose = require('mongoose');
const { get } = require('http');
const e = require("express");
mongoose.connect(mongoURL, {useNewUrlParser: true, useUnifiedTopology: true, dbName: "Goodeat"}).then(() => {console.log("sucessfully connected to database")}).catch((err) => {console.log(err)});

// return [res(int), user]
async function verify(info) {
    try {
        const user = await User.findOne({ username: info.username });
        if (!user) return [-1, null];
        if (user.password != info.password) 
        	return [-2, null];
		user.lastLogin = new Date();
		user.save();
        return [1, user];
    }
    catch (err) {
        console.log(err);
        return [-6, null];
    }
}
async function gainPiece(info, pid) {
    try {
        const [res, user] = await verify(info);
        if (res < 0) return res;
		if (user.pieces.indexOf(pid) == -1) {
			user.pieces.push(pid);
			user.save();
			return 1;
		}
		return 0;
    }
    catch (err) {
        console.log(err);
        return -6;
    }
}
/*
Backend:
​	Socket_id -> user_id
​	user_id -> 
​					socket (ensure only one)
​					room
​					Alive
				   role 

​	room-> started, 
	      board (grids, phase, player, exp, turns), 
		  board.validLevels: arary of length 2, valid levels of each player
		  users: list of users
		  botID: (only after game started) id of bot (-1 if no bot)
		  observers: list of users

API: 

Game operations: 
​	Backend to frontend:
​		Start game, role: create a game
​		update board, board
​		end game, winner
	   init, board

​	Frontend to backend:
​		Connect (send userid) (join room if necessary)
​		Start game: start game in room
​		Update board, board
​		Die

Room operations:
​	Backend to frontend:	
	   room list, list of rooms
​		update room map, map
	   update room users, list of users
​	Frontend to backend:	
	   choose room map, map
	   start game
​		

Connect:

​	Connect; if in started room
*/
// map sockets to rooms

const userInfo = new Map(); // userid -> {}
const roomInfo = new Map(); // room -> {started, board, users, canSpectate}

function RoomNotExist(room) {
	if (room == null)
		return true;
	if (roomInfo.get(room) == undefined)
		return true;
	if (roomInfo.get(room) == null)
		return true;
	return false;
}
function sendRoomList(socket) {
	const rooms = [];
	for (let room of roomInfo.keys()) {
		//if (roomInfo.get(room).isTutorial) continue;
		rooms.push({
			room: room,
			users: roomInfo.get(room).users,
			started: roomInfo.get(room).started,
			canSpectate: roomInfo.get(room).canSpectate});
	}
	socket.emit('room list', rooms);
}
let allSockets = [];
function sendAllRoomList() {
	for (let socket of allSockets)
		sendRoomList(socket);
}

function roomSockets(room) {
	const users = roomInfo.get(room).users;
	const sockets = [];
	for (let user of users)
		if (user != "@Bot")
			sockets.push(userInfo.get(user).socket);
	for (let user of roomInfo.get(room).observers)
		sockets.push(userInfo.get(user).socket);
	return sockets;
}

function updateUsers(room) {
	const users = roomInfo.get(room).users;
	for (let socket of roomSockets(room))
		socket.emit('update room users', users);
}
function updateMap(room) {
	const map = roomInfo.get(room).board.grids;
	for (let socket of roomSockets(room))
		socket.emit('update room map', map);
}
function updateVision(room) {
	const visionRange = roomInfo.get(room).board.visionRange;
	for (let socket of roomSockets(room))
		socket.emit('update room vision', visionRange);
}
function updateSpectate(room) {
	const canSpectate = roomInfo.get(room).canSpectate;
	for (let socket of roomSockets(room))
		socket.emit('update room spectate', canSpectate);
}

function removeUserFromRoom(room, user) {
	// not sure if this is necessary
	if (RoomNotExist(room)) return ;
	userInfo.get(user).room = null;
	let index = roomInfo.get(room).observers.indexOf(user);
	if (index > -1) 
		roomInfo.get(room).observers.splice(index, 1);
	const users = roomInfo.get(room).users;
	index = users.indexOf(user);
	if (index > -1) 
		users.splice(index, 1);
	//console.log("Removed", user, "from", room);
	//console.log("Current users in room", room, roomInfo.get(room).users);
	updateUsers(room);
	if (roomInfo.get(room).users.length == 0) {
		clearRoom(room);
	}
	else if (roomInfo.get(room).users.length == 1 && roomInfo.get(room).users[0] == "@Bot") {
		clearRoom(room);
	}
}
function startGame(room) {
	roomInfo.get(room).started = true;
	const users = roomInfo.get(room).users;
	for (let i = 0; i < users.length; i++) {
		const user = users[i];
		if (user == "@Bot") continue;
		userInfo.get(user).role = i;
		userInfo.get(user).alive = true;
		let socket = userInfo.get(user).socket;
		socket.emit('start game', i);
		// socket.emit('init', roomInfo.get(room).board);
	}
	if (roomInfo.get(room).botID == 0) {
		let socket = userInfo.get(users[1]).socket;
		socket.emit('compute rollout', roomInfo.get(room).board);
	}
}
function clearRoom(room) {
	for (let user of roomInfo.get(room).users)
		if (user != "@Bot")
			userInfo.get(user).room = null;
	// remove room from roomInfo
	roomInfo.delete(room);
	sendAllRoomList();
}
function endGame(room, winner) {
	console.log("Ending game in room", room, "winner", winner);
	for (let socket of roomSockets(room))
		socket.emit('end game', winner);
	clearRoom(room);
}
function checkAlive(room, user) {
	let board = roomInfo.get(room).board;
	let grids = board.grids;
	for (let i = 0; i < grids.length; i++) 
		for (let j = 0; j < grids[i].length; j++) 
			if (grids[i][j].owner == user && grids[i][j].spawnid == user) 
				return true;
	return false;
}

function checkOver(room) {
	if (RoomNotExist(room))	return ;
	const users = roomInfo.get(room).users;
	let numAlive = 0, winner = -1;
	for (let user of users) 
		if (user != "@Bot" && userInfo.get(user).alive) 
			numAlive++, 
			winner = userInfo.get(user).role;
	if (numAlive <= 1) 
		endGame(room, winner);
}
function checkStart(userId) {
	// if in a room and game started, send start game
	const user = userInfo.get(userId);
	//if (user.room === null) return ;
	const room = user.room;
	if (RoomNotExist(room))	return ;
	if (!roomInfo.get(room).started) return ;
	let socket = user.socket;
	socket.emit('start game', user.role);
	// socket.emit('init', roomInfo.get(room).board);
}
function inGame(userId) {
	if (userId == "@Bot") return true;
	const user = userInfo.get(userId);
	if (user.room == null) return false;
	const room = user.room;
	if (!roomInfo.get(room)) return false;
	if (!roomInfo.get(room).started) return false;
	if (!userInfo.get(userId).alive) return false;
	if (userInfo.get(userId).role < 0) return false;
	//if (roomInfo.get(room).isTutorial) return false;
	return true;
}
function addObserver(room, userId) {
	if (inGame(userId)) return ;
	if (!roomInfo.get(room).canSpectate) return ;
	removeUserFromRoom(userInfo.get(userId).room, userId);
	userInfo.get(userId).room = room;
	userInfo.get(userId).role = -1;
	userInfo.get(userId).alive = false;
	roomInfo.get(room).observers.push(userId);
	let socket = userInfo.get(userId).socket;
	socket.emit('set room id', room);
	socket.emit('start game', -1);
	// socket.emit('init', roomInfo.get(room).board);
}
io.on("connection", (socket) => {
	allSockets.push(socket);
	// check if userId exists
	// if not, create new user

	// account
	// info{username, password} fn: callback
	socket.on('create user', async (info, fn) => {
		console.log("create user", info.username);
		try {
			const existingUser = await User.findOne({ username: info.username });
			if (!existingUser) {
				// id is generated by the count of users
				const newID = await User.countDocuments() + 1729;
				let user = new User({
					id: newID,
					username: info.username, 
					password: info.password,
					phoneNumber: info.phoneNumber,

					level: 1,
					exp: 0,
					//pieces: [LEVEL.ARCHER, LEVEL.KNIGHT, LEVEL.CANNON],
					pieces: [1, 2, 3],
					rating: [],
					questProgress: [],
					achivementProgress: [],

					isAdmin: false,
					lastLogin: new Date(),
					language: "中文",
				});
				user.save().then((result) => {
					fn(true, newID);
				}).catch((err) => {
					console.log(err);
				});
			}
			else {
				console.log("Username already exists");
				if (info.password == existingUser.password)
					fn(false, existingUser.id);
				else
					fn(false, -2);
			}
		}
		catch (err) {
			console.log(err);
			fn(false, -6);
		}
	});
	socket.on('login', async (info, fn) => {
		console.log("login", info.username);
		try {
			const [res, user] = await verify({username: info.username, password: info.password});
			if (res > 0) {
				console.log(res > 0 ? "success" : "fail");
				fn(user.id);
			}
			else {
				console.log(res > 0 ? "success" : "fail");
				fn(res);
			}
		}
		catch (err) {
			console.log(err);
			fn(-6);
		}
	});
	socket.on('edit password', async (info, newPassword, fn) => {
		console.log("edit password", info.username);
		try {
			let user = await User.findOne({ username: info.username });
			if (!user) {
				console.log("no such user: ", info.username);
				fn(false);
			}
			else if (user.password == info.password) {
				user.password = newPassword;
				user.save().then((result) => {
					fn(true);
				}).catch((err) => {
					console.log(err);
				});
			}
			else {
				console.log("incorrect password: ", info.username);
				fn(false);
			}
		}
		catch (err) {
			console.log(err);
			fn(false);
		}
	});
	socket.on('gain piece', async (info, pid, fn) => {
		console.log("gain piece", info.username, pid);
		try {
			const res = await gainPiece({username: info.username, password: info.password}, pid);
			// res == 1: success
			// res == 0: already have
			console.log(res > 0 ? "success" : "fail");
			fn(res);
		}
		catch (err) {
			console.log(err);
			fn(-6);
		}
	});

	// game
	socket.on('connected', (userId) => {
		userId = userId * 1;
		const user = userInfo.get(userId);
		//console.log("Connected", userId, user);
		if (user === undefined) 
			userInfo.set(userId, {socket: socket, room: null, alive: false});
		else {
			try {
				user.socket = socket;
				userInfo.set(userId, user);
				checkStart(userId);
			}
			catch (e) {
				console.log(e);
			}
		}
		console.log("Connected", userId);
		/*socket.on('change id', (newID) => {
			if (userInfo.get(newID) !== undefined) return ;
			if (inGame(userId)) return ;
			userInfo.set(newID, {socket: socket, room: null, alive: false});
			userInfo.delete(userId);
			userId = newID;
		});*/
		socket.on('get init', () => {
			try {
				let room = userInfo.get(userId).room;
				if (RoomNotExist(room)) return ;
				socket.emit('init', roomInfo.get(room).board);
			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('get room list', () => {
			try {
				sendRoomList(socket)
			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('exit room', () => {
			try {
				//console.log("exit: ", userId);
				if (inGame(userId)) return ;
				let room = userInfo.get(userId).room;
				if (RoomNotExist(room))	return ;
				removeUserFromRoom(room, userId);
				sendAllRoomList();
			}
			catch (e) {
				console.log(e);
			}
		});

		socket.on('check start', () => {
			try {
				if (!inGame(userId)) return ;
				checkStart(userId);
			}
			catch (e) {
				console.log(e);
			}
		});


		socket.on('choose room map', (map) => {
			try {
				const room = userInfo.get(userId).room;
				console.log("Choose map", room);
				if (RoomNotExist(room))	return ;
				roomInfo.get(room).board.grids = map;
				updateMap(room);
			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('set room vision', (visionRange) => {
			try {
				const room = userInfo.get(userId).room;
				console.log("Set vision", room);
				if (RoomNotExist(room))	return ;
				roomInfo.get(room).board.visionRange = visionRange;
				updateVision(room);
			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('set room levels', (validLevels) => {
			try {
				const room = userInfo.get(userId).room;
				if (RoomNotExist(room))	return ;
				let id = roomInfo.get(room).users.indexOf(userId);
				if (id == -1) return ;
				roomInfo.get(room).board.validLevels[id] = validLevels;
			}
			catch (e) {
				console.log(e);
			}
		});

		socket.on('swap room users', () => {
			try {
				const room = userInfo.get(userId).room;
				console.log("Switch first move", room);
				if (RoomNotExist(room))	return ;
				const users = roomInfo.get(room).users;
				if (users.length < 2) return ;
				// switch users[0] & users[1]
				[users[0], users[1]] = [users[1], users[0]];
				const board = roomInfo.get(room).board;
				[board.validLevels[0], board.validLevels[1]] = [board.validLevels[1], board.validLevels[0]];
				updateUsers(room);
			}
			catch (e) {
				console.log(e);
			}
		})
		socket.on('set room spectate', (canSpectate) => {
			try {
				const room = userInfo.get(userId).room;
				console.log("Set spectate", room);
				if (RoomNotExist(room))	return ;
				roomInfo.get(room).canSpectate = canSpectate;
				updateSpectate(room);
			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('add bot', () => {
			try {
				const room = userInfo.get(userId).room;
				console.log("add bot", room);
				if (RoomNotExist(room))	return ;
				const users = roomInfo.get(room).users;
				if (users.length != 1) return ;
				users.push("@Bot");
				updateUsers(room);
			}
			catch (e) {
				console.log(e);
			}
		})
		socket.on('get room info', (room) =>{
			try {
				room = room * 1;
				if (RoomNotExist(room))	return ;
				//if (roomInfo.get(room) === undefined) return ;
				const board = roomInfo.get(room).board;
				const users = roomInfo.get(room).users;
				const canSpectate = roomInfo.get(room).canSpectate;
				console.log("sending", users);
				socket.emit('update room map', board.grids);
				socket.emit('update room users', users);
				socket.emit('update room vision', board.visionRange);
				socket.emit('update room spectate', canSpectate);
				socket.emit('update unlocked levels', [0, 1, 2, 3, 4, 5, 6]); // TODO: Lookup from database

			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('create room', (room, map) => {
			try {
				room = room * 1;
				console.log("Creating room", room, "with map");
				console.log(userInfo.get(userId));
				if (inGame(userId)) return ;
				roomInfo.set(room, 
					{
						started: false,
						board: {
							grids: map,
							player: 0,
							phase: 3,
							exp: [0, 0],
							turn: 1,
							visionRange: 2, 
							validLevels: [[0,1,2,3], [0,1,2,3]] // TODO: change this
						},
						users: [userId],
						botID: -1,
						observers:[],
						canSpectate:true
					});
				if (userInfo.get(userId).room !== null)
					removeUserFromRoom(userInfo.get(userId).room, userId);
				userInfo.get(userId).room = room;
				//if (isTutorial) 
				//	startGame(room);
				console.log("Created room", room);
				console.log("Current rooms", roomInfo);
				sendAllRoomList();
			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('start game', (room) => {
			try {
				room = room * 1;
				if (RoomNotExist(room))	return ;
				roomInfo.get(room).botID = roomInfo.get(room).users.indexOf("@Bot");
				console.log("Starting game", room);
				console.log("botID", roomInfo.get(room).botID);
				if (roomInfo.get(room).started) return ;
				startGame(room);
				sendAllRoomList();
			}
			catch (e) {
				console.log(e);
			}

		});
		socket.on('join room', (room) => {
			try {
				if (inGame(userId)) return ;
				room = room * 1;
				if (RoomNotExist(room)) {
					console.log("No room", room);
					return ;
				}
				if (room == userInfo.get(userId).room && !roomInfo.get(room).started) {
					socket.emit('success join room', room);
					return ;
				}
				if (roomInfo.get(room).started) {
					//if (roomInfo.get(room).isTutorial) return ;
					if (!roomInfo.get(room).canSpectate) return ;
					addObserver(room, userId);
					return ;
				}
				if (roomInfo.get(room).users.length >= 2) return ;
				if (userInfo.get(userId).room != null)
					removeUserFromRoom(userInfo.get(userId).room, userId);
				console.log("Joining room", room, userId, roomInfo.get(room).users);
				// check if room is full
				// if not, join room
				const users = roomInfo.get(room).users;
				users.push(userId);
				userInfo.get(userId).room = room;
				//console.log("Added", userId, "to", room);
				//console.log("Current users in room", room, roomInfo.get(room).users);
				socket.emit('success join room', room);
				updateUsers(room);
				/*let board = roomInfo.get(room).board;
				socket.emit('update room map', board.grids);
				socket.emit('update room users', users);
				socket.emit('update room vision', board.visionRange);
				socket.emit('update room spectate', roomInfo.get(room).canSpectate);*/
				sendAllRoomList();
			}
			catch (e) {
				console.log(e);
			}

		});
		socket.on('update grids', (grids) => { // only grids
			try {
				const room = userInfo.get(userId).room;
				if (RoomNotExist(room))	return ;
				roomInfo.get(room).board.grids = grids;
				console.log("Updating grids", userId, room);
				for (let otherSocket of roomSockets(room)) 
					if (otherSocket !== socket)
						otherSocket.emit('update grids', grids);
				//else console.log("Not sending to self", otherSocket.id, socket.id);
			}
			catch (e) {
				console.log(e);
			}

		});
		socket.on('update infos', (board) => { // board(without grids)
			try {
				const room = userInfo.get(userId).room;
				console.log("Updating infos", room, board.phase, board.player);
				if (RoomNotExist(room))	return ;
				//board.grids = roomInfo.get(room).board.grids;
				//roomInfo.get(room).board = board;
				// board and roomInfo.get(room).board are both objects
				// for each property in board, change the same property in roomInfo.get(room).board to the same value, use object.keys
				for (let prop of Object.keys(board)) {
					roomInfo.get(room).board[prop] = board[prop];
				}
				/*roomInfo.get(room).board.phase = board.phase;
				roomInfo.get(room).board.player = board.player;
				roomInfo.get(room).board.exp = board.exp;
				roomInfo.get(room).board.turn = board.turn;*/
				for (let otherSocket of roomSockets(room))
					if (otherSocket !== socket)
						otherSocket.emit('update infos', board);
				/*if (roomInfo.get(room).isTutorial) {
					let info = roomInfo.get(room).board;
					// check game end & check opponent's turn
					if (info.player == 1) {
						info.turn += 1;
						if (!checkAlive(room, 0)) endGame(room, 1);
						else {
							let phasePlayerPairs = [[1, 1], [2, 1]];
							for (let phasePlayerPair of phasePlayerPairs) {
								let phase = phasePlayerPair[0];
								let player = phasePlayerPair[1];
								info.phase = phase;
								info.player = player;
								socket.emit('update infos', info);
							}
							socket.emit('compute rollout', info);
						}
					}
				}*/
				let info = roomInfo.get(room).board;
				if (roomInfo.get(room).users[info.player] == "@Bot") {
					// check game end & check opponent's turn
					console.log("Bot's turn", info.player, info.turn);
					//info.turn += 1;
					if (!checkAlive(room, 1 - info.player))
						endGame(room, info.player);
					else {
						let phasePlayerPairs = [[1, info.player], [2, info.player]];
						for (let phasePlayerPair of phasePlayerPairs) {
							let phase = phasePlayerPair[0];
							let player = phasePlayerPair[1];
							info.phase = phase;
							info.player = player;
							socket.emit('update infos', info);
						}
						socket.emit('compute rollout', info);
					}
				}
			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('rollout result', (result) => {
			try {
				const room = userInfo.get(userId).room;
				if (RoomNotExist(room)) {
					console.log('received result but room empty');
					return ;
				}
				// how to assert
				const info = roomInfo.get(room).board;
				const botID  = roomInfo.get(room).botID;
				//console.log("rollout", info.grids);
				if (!checkAlive(room, botID))
					endGame(room, 1 - botID);
				else {
					info.exp = result.exp;
					info.grids = result.grids;
					info.phase = 3;
					if (botID == 0) {
						info.player = 1;
					}
					else {
						info.player = 0;
						info.turn += 1;
					}
					for (let s of roomSockets(room)) {
						s.emit('update grids', info.grids);
						s.emit('update infos', info);
					}
				}
			}
			catch (e) {
				console.log(e);
			}
		});
		socket.on('die', async () => {
			try {
				userInfo.get(userId).alive = false;
				const room = userInfo.get(userId).room;
				if (RoomNotExist(room)) {
					console.log("Invalid die");
					return ;
				}
				console.log("DIE ", room, roomInfo);
				const botID = roomInfo.get(room).botID;
				if (botID != -1) {
					endGame(room, botID);
					return ;
				}
				checkOver(room);
			}
			catch (e) {
				console.log(e);
			}

		});
	});
	// disconnect is fired when a client leaves the server
});

io.on("disconnect", (socket) => {
	try{
		console.log("a user disconnected");
		// remove socket from allSockets
		console.log("Before", allSockets.length);
		allSockets = allSockets.filter((s) => s !== socket);
		console.log("After", allSockets.length);
	}
	catch (e) {
		console.log(e);
	}
});


app.get("/", (req, res) => {
	res.send("Hello World!");
});


/**
 * Todo:
 *    Add map selector & 
 * 	  Room list
 *    Waiting room
 */