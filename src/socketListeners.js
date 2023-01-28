
import Cookies from "universal-cookie";
import { notifyNewTurn } from "./notify.js";
import { rollout } from "./rollout.js";
let binded = false;

export function bind() {
    if (binded) return;
    console.log("Binding socket listeners");
    binded = true;
    window.socket.on('start game', (role) => {
        console.log("Received start game event", role);
        const cookies = new Cookies();
        cookies.set('role', role, { path: '/' });
        notifyNewTurn();
        // go to the game page
        this.props.navigate('/game');
        console.log("Navigated to game page");
    });
    
    window.socket.on('success join room', (room) => {
        new Cookies().set('room', room, { path: '/' });
        this.props.navigate('/gameroom');
    });
    
    window.socket.on('end game', (winner) => {
        const cookies = new Cookies();
        cookies.set('winner', winner, { path: '/' });
        this.props.navigate('/endgame');
    });
    window.socket.on('set room id', (room) => {
        const cookies = new Cookies();
        cookies.set('room', room, { path: '/' });
    });
    window.socket.on('compute rollout', (board) => {
        //console.log(board);
        let result = rollout(board);
        window.socket.emit('rollout result', result);
    });
}