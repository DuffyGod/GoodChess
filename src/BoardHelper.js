
import { validMoves, exps, towerKills, LEVEL, needMove } from "./levels.js";
export function modifyGrid(grids, row, col, content) {
    content.ontrack = grids[row][col].ontrack;
    content.spawnid = grids[row][col].spawnid;
    grids[row][col] = content;
}
export function clearGrid(grids, row, col) {
    let old = { ...grids[row][col] }; // add a copy
    old.owner = -1;
    old.level = 0;
    modifyGrid(grids, row, col, old);
}
export function middleMove(grids) {
    // 中立移动
    const moves = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    while (1) {
        let moved = false;
        for (let tp = 0; tp < 4; tp++) 
            while (1) {
                let curMoved = false;
                for (let i = 0; i < grids.length; i++) 
                    for (let j = 0; j < grids[0].length; j++) 
                        if (grids[i][j].owner == 2) {
                            let row = i + moves[tp][0];
                            let col = j + moves[tp][1];
                            if (row >= 0 && row < grids.length && col >= 0 && col < grids[0].length) {
                                let old = { ...grids[row][col] };
                                if (old.owner == 2 || old.owner == -1) continue;
                                if (!old.ontrack) continue;
                                curMoved = true;
                                moved = true;
                                modifyGrid(grids, row, col, {...grids[i][j]});
                                clearGrid(grids, i, j);
                            }
                        }
                if (!curMoved) break;
            }
        if (!moved) break;
    }
}
export function move(grids, start, end, player) {
    let oldInfo = { ...grids[start[0]][start[1]] };
    oldInfo.moved = true;
    let endInfo = { ...grids[end[0]][end[1]] };
    //console.log("Get exp ", endInfo.level);
    let incExp = 0;
    if (oldInfo.level == LEVEL.CANNON) {
        if (end[0] != start[0] || end[1] != start[1])
            incExp -= 1;
        else {
            let sumexp = 0;
            for (let mv of towerKills()) {
                let row = start[0] + mv[0];
                let col = start[1] + mv[1];
                if (row >= 0 && row < grids.length && col >= 0 && col < grids[0].length) {
                    let old = { ...grids[row][col] };
                    if (old.owner != -1 && old.owner != player) {
                        sumexp += exps(old.level);
                        clearGrid(grids, row, col);
                    }
                }
            }
            modifyGrid(grids, end[0], end[1], oldInfo);
            incExp += sumexp;
            return incExp;  
        }
    }
    else if (end[0] == start[0] && end[1] == start[1]) { // moved; 
        modifyGrid(grids, end[0], end[1], oldInfo);
        return incExp;
    }
	if (endInfo.owner != -1)
        incExp += exps(endInfo.level);
        // 
    clearGrid(grids, start[0], start[1]);
    clearGrid(grids, end[0], end[1]);
    if (needMove(oldInfo.level, [end[0] - start[0], end[1] - start[1]]))
        modifyGrid(grids, end[0], end[1], oldInfo);
    else // stay
        modifyGrid(grids, start[0], start[1], oldInfo);

    return incExp;
}
export function computeHave(grids, id) {
    // return array of [boolean, boolean, boolean]
    let have = [false, false, false];
    let row = grids.length;
    let col = grids[0].length;
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            if (grids[i][j].spawnid != id) continue;
            if (grids[i][j].owner == -1) continue;
            have[grids[i][j].owner] = true;
        }
    return have;
}
export function region(grids, id) {
    let row = grids.length;
    let col = grids[0].length;
    let region = [];
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            if (grids[i][j].spawnid != id) continue;
            region.push([i, j]);
        }
    return region;
}

	
export function canMove(startGrid, player) {
    if (startGrid.moved) return false;
    if (startGrid.owner != player) return false; // include empty
    return true;
}
export function checkMove(grids, start, end, player) {
    // return how much exp needed
    let inf = 1e9;
    if (!canMove(grids[start[0]][start[1]], player)) return inf;
    let level = grids[start[0]][start[1]].level;
    // check if the move is valid
    // return true or false
    let res = [end[0] - start[0], end[1] - start[1]];
    const allMoves = validMoves(level);
    if (!allMoves.some((move) => {
        return move[0] == res[0] && move[1] == res[1];
    })) return inf;
    if (level == LEVEL.CANNON && (res[0] != 0 || res[1] != 0)) return 1;
    else return 0;
}