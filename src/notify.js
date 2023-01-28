import newTurnSound from './assets/newTurn.wav';
import newPlayerSound from './assets/newPlayer.wav';
import Cookies from "universal-cookie";
export function notifyNewTurn() {
    let soundOn = new Cookies().get('sound');
    if (soundOn == 'off') return ;
    new Audio(newTurnSound).play();
}
export function notifyNewPlayer() {
    let soundOn = new Cookies().get('sound');
    if (soundOn == 'off') return ;
    new Audio(newPlayerSound).play();
}
export function toggleSound() {
    let soundOn = new Cookies().get('sound');
    if (soundOn == 'off') {
        new Cookies().set('sound', 'on', { path: '/' });
    } else {
        new Cookies().set('sound', 'off', { path: '/' });
    }
}