import { abs } from "mathjs";

// create enum
export const levels = 7;
const inf = 1e8;
export const LEVEL = {
    PAWN: 0,
    ARCHER: 1,
    KNIGHT: 2,
    CANNON: 3, 
    ASSASSIN: 4, 
    ROOK: 5, 
    ARMEDROOK: 6,
};

export function validMoves(level) {
    if (level == LEVEL.PAWN) return [[1, 0], [0, 1], [-1, 0], [0, -1]];
    else if (level == LEVEL.ARCHER) return [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    else if (level == LEVEL.KNIGHT) return [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
    else if (level == LEVEL.CANNON) return [
								[1, 0],
								[0, 1],
								[-1, 0],
								[0, -1],
                                [0, 0]
							];
    else if (level == LEVEL.ASSASSIN) return [[3, 0], [0, 3], [-3, 0], [0, -3]];
    else if (level == LEVEL.ROOK || level == LEVEL.ARMEDROOK) 
        return [[1, 0], [0, 1], [-1, 0], [0, -1], [0, 2], [0, -2], [2, 0], [-2, 0]];
    else return [];
}
export function towerKills() {
    return [[0,1],[0,2], [0,-1], [0,-2], [1,0], [2,0], [-1,0], [-2,0]];
}
export function exps(level) {
    if (level == LEVEL.PAWN || level == LEVEL.ARCHER) return 1;
    if (level == LEVEL.ASSASSIN) return 1;
    if (level == LEVEL.KNIGHT || level == LEVEL.CANNON) return 2;
    if (level == LEVEL.ROOK || level == LEVEL.ARMEDROOK) return 2;
    return 0; 
}
export function needMove(level, dir) {
    if (level == LEVEL.ARMEDROOK) {
        if (abs(dir[0]) + abs(dir[1]) == 2) return false;
    }
    return true;
}

// About upgrades

let upgradeList = [[LEVEL.PAWN, LEVEL.ARCHER, 1], 
[LEVEL.ARCHER, LEVEL.KNIGHT, 1], 
[LEVEL.PAWN, LEVEL.CANNON, 3],
[LEVEL.PAWN, LEVEL.ASSASSIN, 1],
[LEVEL.ASSASSIN, LEVEL.ROOK, 1],
[LEVEL.ROOK, LEVEL.ARMEDROOK, 1]];
// export

let init = false;
let upgradeCost = [];
function initCost() {
    if (init) return ;
    init = true;
    for (let i = 0; i < levels; i++) {
        upgradeCost.push([]);
        for (let j = 0; j < levels; j++) {
            upgradeCost[i].push(inf);
        }
        upgradeCost[i][i] = 0;
    }
    for (let i = 0; i < upgradeList.length; i++) {
        let u = upgradeList[i];
        upgradeCost[u[0]][u[1]] = u[2];
    }
    for (let k = 0; k < levels; k++) {
        for (let i = 0; i < levels; i++) {
            for (let j = 0; j < levels; j++) {
                upgradeCost[i][j] = Math.min(upgradeCost[i][j], upgradeCost[i][k] + upgradeCost[k][j]);
            }
        }
    }
}
export function getUpgradeCost(from, to) {
    initCost();
    return upgradeCost[from][to];
}
export function nextLevels(level) {
    let result = [];
    for (let i = 0; i < levels; i++) 
        if (getUpgradeCost(level, i) < inf / 2) 
            result.push(i);
    return result;
}