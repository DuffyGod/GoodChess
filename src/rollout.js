import { validMoves, towerKills } from "./levels.js";
import {modifyGrid, clearGrid, middleMove, move, computeHave, region} from "./BoardHelper.js";
import {random, randomInt} from "mathjs";
// include math

let board;

let row, col, role;
let regionGrids; // map to Array[3], whose keys is spawnidSet
let distances; // row x col, array of [id, dist]
let distanceMap; // map from grids to distances
let ownedGrids; // Array of length 3, grids owned by players (index 2: NPC)
const players = 2;
let spawnidSet; // set of spawnids
let exp;
let grids;
let assignedGrids; // array of length 3, each one: map from spawnid to pieces of the player assigned
let mustMove = false;
function init() {
    row = grids.length;
    col = grids[0].length;
    role = board.player;
    exp = board.exp;
    spawnidSet = new Set();
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            board.grids[i][j].moved = false;
            grids[i][j].moved = false;
            if (grids[i][j].spawnid != -1)
                spawnidSet.add(grids[i][j].spawnid);
        }
    // compute distance
    regionGrids = new Map();
    distances = new Array();
    distanceMap = new Array();
    ownedGrids = new Array(3).fill().map(() => new Array()); // 0, 1 : players; 2 : middle
    for (let i = 0; i < row; i++) {
        distances.push(new Array(col).fill().map(() => new Array()));
        distanceMap.push(new Array(col).fill().map(() => new Map()));
    }
    for (let id of spawnidSet)
        regionGrids.set(id, new Array(3).fill().map(() => new Array())); 
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            if (grids[i][j].spawnid != -1 && grids[i][j].owner != -1) 
                regionGrids.get(grids[i][j].spawnid)[grids[i][j].owner].push([i, j]);
            if (grids[i][j].owner != -1) 
                ownedGrids[grids[i][j].owner].push([i, j]);
        }
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            let curMap = new Array();
            for (let id of spawnidSet) {
                let minDist = 100;
                for (let [x, y] of region(grids, id)) {
                    let dist = Math.abs(x - i) + Math.abs(y - j);
                    minDist = Math.min(minDist, dist);
                }
                distanceMap[i][j].set(id, minDist);
                curMap.push([id, minDist]);
            }
            curMap.sort((x, y) => (x[1] - y[1]));
            distances[i][j] = curMap;
        }
    // console.log(ownedGrids);
}
function assignOthers() {
    assignedGrids = new Array(3).fill().map(() => new Map()); 
    for (let i = 0; i < 3; i++)
        for (let id of spawnidSet)
            assignedGrids[i].set(id, []);
    for (let [i, j] of ownedGrids[role ^ 1]) {
        let nearestSpawnid = distances[i][j][0][0];
        assignedGrids[role ^ 1].get(nearestSpawnid).push([i, j]);
    }
    for (let [i, j] of ownedGrids[2]) {
        let spawnid = grids[i][j].spawnid;
        if (spawnid != -1)
            assignedGrids[2].get(spawnid).push([i, j]);
    }
}
function setTarget(grid) {
    let [i, j] = grid;
    if (grids[i][j].owner != 2) return ;
    for (let dir of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]]) {
        let [x, y] = dir;
        if (i + x >= 0 && i + x < row && j + y >= 0 && j + y < col) 
            grids[i + x][j + y].target = true;
    }
}
function targetPath(grid, id) {
    // the path from grid to id
    let [i, j] = grid;
    while (distanceMap[i][j].get(id) > 0) {
        setTarget([i, j]);
        let minDist = 100;
        let minDir = [0, 0];
        for (let dir of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            let [x, y] = dir;
            if (i + x >= 0 && i + x < row && j + y >= 0 && j + y < col) {
                let dist = distanceMap[i + x][j + y].get(id);
                if (dist < minDist || (dist == minDist && grids[i + x][j + y].owner != 2)) {
                    minDist = dist;
                    minDir = [x, y];
                }
            }
        }
        [i, j] = [i + minDir[0], j + minDir[1]];
    }
}
function targetRegion(id) {
    for (let [i, j] of region(grids, id)) 
        setTarget([i, j]);
}
function assignSelf() {
    // Effect: change grids.goal / .target

    // ??????????????????????????????????????????????????????
	// 		??????????????????????????????/?????? ??????????????????assign??????????????????????????? > ?????????????????????????????????????????? >= ?????????1
	// 		?????????for???????????????for????????????????????? >= ?????? + minDist???????????????
	// 		??????????????????????????????
	// 			>= 3 exp: ???????????????
	// 			Else????????????Size / 2 + 1?????? ????????????????????????

    // defend
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) 
            grids[i][j].target = false;
    let remainedGrids = JSON.parse(JSON.stringify(ownedGrids[role]));
    function remove(grid) {
        remainedGrids.splice(remainedGrids.indexOf(grid), 1);
    }
    function assignAmount(id, num, type = -1) {
        if (!num) return true;
        console.log("Assign ", id, num);
        // console.log(remainedGrids);
        let sortedGrids = remainedGrids.sort((x, y) => distanceMap[x[0]][x[1]].get(id) - distanceMap[y[0]][y[1]].get(id));
        let count = 0;
        for (let grid of sortedGrids) {
            if (type != -1 && type != grids[grid[0]][grid[1]].level) continue;
            assignedGrids[role].get(id).push(grid);
            remove(grid);
            count++;
            if (count == num) break;
        }
        console.log("Assigned ", count);
        return count >= num;
    }
    
    let computedRegions = new Set();
    // controlled 
    for (let id of spawnidSet) {
        let have = computeHave(grids, id);
        if (have[role] && !have[role ^ 1] && !have[2]) {
            assignAmount(id, 1);
            computedRegions.add(id);
        }
    }
    for (let id of computedRegions) 
        assignAmount(id, assignedGrids[role ^ 1].get(id).length);
    // defend
    for (let type = 0; type < 2; type++) 
        for (let id of spawnidSet) {
            if (computedRegions.has(id)) continue;
            let enemies = assignedGrids[role ^ 1].get(id).length;
            if (!enemies) continue;

            let have = false;
            if (type && regionGrids.get(id)[2].length) have = true;
            if (regionGrids.get(id)[role].length) have = true;
            if (!have) continue;
            
            have = false;
            for (let [i, j] of remainedGrids) 
                if (distances[i][j][0][0] == id) have = true; // self : assigned
            if (!have) continue;
            
            computedRegions.add(id);
            assignAmount(id, enemies + 1, -1);
        }
    // attack 
    for (let id of spawnidSet) {
        if (computedRegions.has(id)) continue;
        if (!regionGrids.get(id)[role ^ 1].length) continue;
        computedRegions.add(id);
        for (let dist = 1; dist <= row + col; dist++) {
            let remCount = 0, enemyCount = 0;
            for (let [i, j] of remainedGrids) 
                if (distanceMap[i][j].get(id) <= dist) remCount++;
            for (let [i, j] of ownedGrids[role ^ 1])
                if (distanceMap[i][j].get(id) <= dist) enemyCount++;
            if (remCount >= enemyCount + dist) {
                if (assignAmount(id, remCount, -1))
                    mustMove = true;
                break;
            }
        }
    }
    console.log("After attack:", exp[role]);
    // middle
    let middleIds = [];
    for (let id of spawnidSet) {
        if (computedRegions.has(id)) continue;
        let totalDist = 0;
        for (let [i, j] of remainedGrids) 
            totalDist += distanceMap[i][j].get(id);
        middleIds.push([id, totalDist]);
    }
    middleIds.sort((x, y) => x[1] - y[1]);
    let firstMiddle = (role ^ 1);
    for (let [id, dist] of middleIds) {
        if (computedRegions.has(id)) continue;
        computedRegions.add(id);
        let middles = regionGrids.get(id)[2].length;
        let need = Math.floor((middles + 1) / 2) + 1;
        if (assignAmount(id, need, -1)) {
            mustMove = true;
            targetRegion(id);
            firstMiddle = id;
        }
    }
    // put the goal into goal
    for (let [i, j] of remainedGrids) 
        grids[i][j].goal = firstMiddle;
    
    for (let id of spawnidSet) 
        for (let [i, j] of assignedGrids[role].get(id)) {
            grids[i][j].goal = id;
            targetPath([i, j], id);
        }
}
function attackRange(level) {
    if (level != 3) return validMoves(level);
    else return towerKills(); 
}
function evaluate(brd) {
    let board = JSON.parse(JSON.stringify(brd));
    let totalDist = 0;
    let value = 0;
    let pieces = 0, totalLevel = 0, enemyPieces = 0;
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            if (board.grids[i][j].owner == (role ^ 1)) enemyPieces += 1;
            if (board.grids[i][j].owner != role) continue;
            pieces += 1;
            totalLevel += board.grids[i][j].level;
            let goal = board.grids[i][j].goal;
            if (goal != -1) {
                let dist = distanceMap[i][j].get(goal);
                totalDist += dist;
            }
        }
    let expValue = 0.5;
    value -= 0.001 * totalDist; value += totalLevel * expValue;
    value += pieces - enemyPieces;
    value += board.exp[role] * expValue;
    // controlled cities
    for (let id of spawnidSet) {
        let have = computeHave(board.grids, id);
        if (have[role] && (!have[role ^ 1] && !have[2])) value += 1.5;
        if (!have[role] && have[role ^ 1] && !have[2]) value -= 1.5;
        if (!have[role] && (role == id)) value -= 1000;
    }
    function check(a, b) {
        return (0 <= a && a < row && 0 <= b && b < col);
    }
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            board.grids[i][j].protected = false;
            board.grids[i][j].underAttack = false;
        }
    
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            if (board.grids[i][j].owner != (role ^ 1)) continue;
            for (let [x, y] of attackRange(board.grids[i][j].level)) {
                if (!check(i + x, j + y)) continue;
                if (board.grids[i + x][j + y].owner == role) 
                    board.grids[i + x][j + y].underAttack = true;
            }
        }
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            if (board.grids[i][j].owner != role) continue;
            if (board.grids[i][j].underAttack) continue;
            let killMiddles = 0;
            for (let [x, y] of attackRange(board.grids[i][j].level)) {
                if (!check(i + x, j + y)) continue;
                if (board.grids[i + x][j + y].owner == role)
                    board.grids[i + x][j + y].protected = true;
                else {
                    board.grids[i + x][j + y].underAttack = true;
                    if (board.grids[i + x][j + y].owner == 2 && grids[i + x][j + y].target) 
                        killMiddles += 1;
                }
            }
            if (killMiddles >= 2 && board.grids[i][j].level == 3) 
                board.grids[i][j].goodTower = true;
        }
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++)
            if (board.grids[i][j].owner == (role ^ 1) && board.grids[i][j].level == 3)
                for (let [x, y] of attackRange(board.grids[i][j].level)) 
                    if (!check(i + x, j + y)) continue;
                    else if (board.grids[i + x][j + y].owner == role) 
                        board.grids[i + x][j + y].protected = false;
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) {
            if (board.grids[i][j].owner == -1) continue;
            if (board.grids[i][j].owner == role) {
                if (board.grids[i][j].underAttack) {
                    value -= (board.grids[i][j].level + 1) / 2;
                    if (board.grids[i][j].protected) 
                        value += (board.grids[i][j].level + 1) * 0.4;
                }
                else if (board.grids[i][j].goodTower) value += 0.5;
            }
            else {
                if (board.grids[i][j].underAttack && board.grids[i][j].owner == (role ^ 1)) 
                    value += 0.1;
            }
        }
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) 
            if (board.grids[i][j].owner == 2 && grids[i][j].target) { 
                value -= 0.8;
                let nbhd = 0;
                for (let dir of validMoves(0)) {
                    let [x, y] = dir;
                    if (check(i + x, j + y) && board.grids[i + x][j + y].owner == 2) 
                        nbhd = 1;
                }
                if (!nbhd) {
                    value += 0.6;
                    if (board.grids[i][j].underAttack) value += expValue / 2;
                }
            }
    // console.log("Target: " + count + " Value: " + value + "");
        
    return value;
}
function getGrid(brd, grid) {
    let [i, j] = grid;
    return brd.grids[i][j];
}
function checkOwner(brd, grid) {
    return (getGrid(brd, grid).owner == role);
}
function checkValid(grid) {
    let [i, j] = grid;
    return i >= 0 && i < row && j >= 0 && j < col;
}
function possibleActions(brd, grid) {
    if (!checkOwner(brd, grid)) return [];
    let cur = getGrid(brd, grid);
    let result = [];
    let moves = validMoves(cur.level);
    if (cur.level != 3) moves.push([0, 0]);
    for (let dir of moves) 
        for (let lv = cur.level; lv <= 3; lv++) {
            if (lv == 3 && (cur.level != 0 && cur.level != 3)) continue;
            let goal = [grid[0] + dir[0], grid[1] + dir[1]];
            if (!checkValid(goal)) continue;
            result.push([goal, lv]);
        }
    return result;
}
function allGrids() {
    let result = [];
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++) 
            result.push([i, j]);
    return result;
}
function act(brd) {
    // act brd, to attain the action
    // first: act grids
    let board = JSON.parse(JSON.stringify(brd));
    let ownedGrids = [];
    for (let grid of allGrids())
        if (checkOwner(board, grid)) ownedGrids.push(grid);
    while (ownedGrids.length) {
        let removed = [];
        for (let grid of ownedGrids) {
            if (!checkOwner(board, grid)) {
                console.log("???");
                continue;
            }
            if (getGrid(board, grid).moved) continue;
            let action = getGrid(board, grid).action;
            if (action.length != 2) console.log(action);
            let [goal, lv] = action;
            if (!board.exp[role] && (getGrid(board, grid).level == 3 && goal[0] + goal[1] != grid[0] + grid[1]))
                continue;
            if ((goal[0] != grid[0] || goal[1] != grid[1]) && checkOwner(board, goal)) continue;
            let incexp = move(board.grids, grid, goal, role);
            board.exp[role] += incexp;
            middleMove(board.grids);
            removed.push(grid);
        }
        for (let grid of removed)
            ownedGrids.splice(ownedGrids.indexOf(grid), 1);
        if (!removed.length) break;
    }
    for (let grid of allGrids()) 
        if (checkOwner(board, grid)) {
            let [goal, lv] = getGrid(board, grid).action;
            let needed = lv - getGrid(board, grid).level;
            if (board.exp[role] >= needed) {
                getGrid(board, grid).level = lv;
                board.exp[role] -= needed;
            }
        }
    return board;
}

function randomOrder() {
    let grids = [];
    for (let i = 0; i < row; i++)
        for (let j = 0; j < col; j++)
            grids.push([i, j]); 
    grids.sort((x, y) => Math.random() - 0.5);
    return grids;
}
function dmyMove(brd, rounds = 5) {
    // shuffle the grids, for each one: move it to the best place
    let board = JSON.parse(JSON.stringify(brd));
    for (let grid of allGrids()) {
        if (!checkOwner(board, grid)) continue;
        let actions = possibleActions(board, grid);
        getGrid(board, grid).action = actions[randomInt(actions.length)];
        getGrid(board, grid).action[1] = getGrid(board, grid).level;
    }
    for (let i = 0; i < rounds; i++) {
        let order = randomOrder();
        for (let grid of order) {
            if (!checkOwner(board, grid)) continue;
            let bestActions = [];
            let bestValue = -1e9;
            let actions = possibleActions(board, grid);
            for (let action of actions) {
                let curBoard = JSON.parse(JSON.stringify(board));
                getGrid(curBoard, grid).action = action;
                let val = evaluate(act(curBoard));
                if (val > bestValue) {
                    bestValue = val;
                    bestActions = [action];
                }
                else if (val == bestValue) bestActions.push(action);
            }
            let minLevel = 4;
            for (let action of bestActions)
                minLevel = Math.min(minLevel, action[1]);
            bestActions = bestActions.filter(x => x[1] == minLevel);
            getGrid(board, grid).action = bestActions[randomInt(bestActions.length)];
        }
    }
    return act(board);
}
function greedyMove(brd, rounds = 10) {
    let bestBoard;
    let val = -1e9;
    for (let i = 0; i < rounds; i++) {
        let curBoard = dmyMove(brd);
        let curVal = evaluate(curBoard);
        if (curVal > val) {
            val = curVal;
            console.log("greedy", val);
            bestBoard = curBoard;
        }
    }
    return bestBoard;
}
function bestUpgrade(brd, grid) {
    let [i, j] = grid;
    // console.log(brd.grids);
    // console.log(grid);
    if (brd.grids[i][j].owner != role) return brd;
    let board = JSON.parse(JSON.stringify(brd));
    let level = board.grids[grid[0]][grid[1]].level;
    let bestBoard = JSON.parse(JSON.stringify(board)), bestVal = evaluate(bestBoard);
    for (let to = level; to <= 3; to++) {
        if (to == 3 && level != 0) continue;
        if (board.exp[role] < to - level) continue;
        let tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard.grids[i][j].level = to;
        tempBoard.exp[role] -= to - level;
        let val = evaluate(tempBoard);
        if (val > bestVal) {
            bestVal = val;
            bestBoard = tempBoard;
        }
    }
    return bestBoard;
}

function greedyUpgrade(board, rounds) {
    let bestVal = -1e9, bestBoard = JSON.parse(JSON.stringify(board));
    for (let i = 0; i < rounds; i++) {
        let order = randomOrder();
        let curBoard = JSON.parse(JSON.stringify(board));
        for (let grid of order) 
            curBoard = bestUpgrade(curBoard, grid);
        let val = evaluate(curBoard);
        if (val > bestVal) {
            bestVal = val;
            bestBoard = curBoard;
        }
    }
    return bestBoard;
}
function initBoard() {
    return {grids: JSON.parse(JSON.stringify(grids)), exp: JSON.parse(JSON.stringify(exp))};
}
function greedySpawn(brd) {
    let board = JSON.parse(JSON.stringify(brd));
    for (let id of spawnidSet) {
        let have = computeHave(brd.grids, id);
        if (have[role] && !have[1 ^ role] && !have[2]) { 
            // can spawn
            let bestBoard = JSON.parse(JSON.stringify(board));
            let bestVal = evaluate(bestBoard);
            for (let grid of region(board.grids, id)) {
                if (board.grids[grid[0]][grid[1]].owner != -1) continue;
                let tempBoard = JSON.parse(JSON.stringify(board));
                tempBoard.grids[grid[0]][grid[1]].owner = role;
                tempBoard.grids[grid[0]][grid[1]].level = 0;
                tempBoard.grids[grid[0]][grid[1]].goal = -1;
                middleMove(tempBoard.grids);
                let newVal = evaluate(tempBoard);
                if (newVal > bestVal) {
                    bestVal = newVal;
                    bestBoard = tempBoard;
                }
            }
            board = bestBoard;
        }
    }
    board = greedyUpgrade(board, 20);
    return board;
}
function shouldMove(boardMove, boardSpawn, baordInit) {
    if (evaluate(boardMove) <= evaluate(boardSpawn)) return false;
    console.log("EXP", boardMove.exp);
    if (mustMove) return true;
    if (evaluate(boardMove) > evaluate(boardSpawn)) return true;
    else return false;
}
export function rollout(brd) {
    mustMove = false;
    board = JSON.parse(JSON.stringify(brd));
    grids = JSON.parse(JSON.stringify(brd.grids));
    init();
    assignOthers();
    assignSelf();
    let boardMove = greedyMove(initBoard());
    let boardSpawn = greedySpawn(initBoard());
    if (shouldMove(boardMove, boardSpawn, initBoard())) {
        console.log("Move");
        return boardMove;
    }
    else {
        console.log("Spawn");
        return boardSpawn;
    }
}
/*
a^2 \mod n 
B
*/