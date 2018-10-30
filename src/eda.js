#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const common_1 = require("./common");
const occupationMetrics = new Map();
// data structure requirements:
// 1. quick lookup to increment count
// 2. quick way to retrieve 10 items by largest count
const stateMetrics = new Map();
// data structure requirements:
// 1. quick lookup to increment count
// 2. quick way to retrieve 10 items by largest count
const missingOccupationRows = new Map();
const missingStateRows = new Map();
const processForOccupationMetric = (row) => {
    let key = null;
    for (const k of common_1.VALID_OCCUPATION_KEY) {
        if (k in row) {
            key = k;
            break;
        }
    }
    if (key === null) {
        return;
    }
    const occupation = common_1.sanitizeOccupation(row[key]);
    if (occupation === '') {
        missingOccupationRows.set(row[''], row);
        return;
    }
    if (!occupationMetrics.has(occupation)) {
        occupationMetrics.set(occupation, {
            occupation,
            count: 1,
        });
    }
    else {
        const occupationMetric = occupationMetrics.get(occupation);
        occupationMetric.count++;
    }
};
const processForStateMetric = (row) => {
    let key = null;
    for (const k of common_1.VALID_STATE_KEY) {
        if (k in row) {
            key = k;
            break;
        }
    }
    if (key === null) {
        return;
    }
    const state = common_1.sanitizeState(row[key]);
    if (state === '') {
        missingStateRows.set(row[''], row);
        return;
    }
    if (!stateMetrics.has(state)) {
        stateMetrics.set(state, {
            state,
            count: 1,
        });
    }
    else {
        const stateMetric = stateMetrics.get(state);
        stateMetric.count++;
    }
};
let headers = [];
const processLine = (line) => {
    const re = new RegExp('^"(.*)"$');
    const cells = line.split(common_1.DELIMITER).map(cell => {
        const match = cell.match(re);
        if (match) {
            return match[1]; // handle string in quotes
        }
        else {
            return cell;
        }
    });
    if (headers.length === 0) {
        headers = cells;
    }
    else {
        const row = {};
        headers.forEach((header, index) => {
            row[header] = cells[index];
        });
        if (common_1.isApproved(row)) {
            // TODO should we impute missing occupations?
            // TODO should we filter by H1B visa?
            processForOccupationMetric(row);
            processForStateMetric(row);
        }
    }
};
const endParsing = (outputFolder) => {
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }
    /* EDA - start */
    // list all occupations
    const occupations = [...occupationMetrics.keys()];
    occupations.sort();
    common_1.writeArray(occupations, path.join(outputFolder, 'occupation_list.txt'));
    // list all states
    const states = [...stateMetrics.keys()];
    states.sort();
    common_1.writeArray(states, path.join(outputFolder, 'state_list.txt'));
    // list all rows with missing occupation
    const missingOccupations = [...missingOccupationRows.values()];
    if (missingOccupations.length > 0) {
        const headers = Object.keys(missingOccupations[0]);
        const rows = missingOccupations.map(occupation => headers.map(header => String(occupation[header])));
        common_1.writeCSV(path.join(outputFolder, 'missing_occupation.csv'), headers, rows, common_1.DELIMITER);
    }
    // list all rows with missing state
    const missingStates = [...missingStateRows.values()];
    if (missingStates.length > 0) {
        const headers = Object.keys(missingStates[0]);
        const rows = missingStates.map(state => headers.map(header => String(state[header])));
        common_1.writeCSV(path.join(outputFolder, 'missing_states.csv'), headers, rows, common_1.DELIMITER);
    }
    /* EDA - End */
};
if (typeof require != 'undefined' && require.main == module) {
    const args = process.argv.slice(2);
    const inputPath = args[0];
    const outputFolder = args[1];
    readline.createInterface({
        input: fs.createReadStream(inputPath, 'utf8'),
    })
        .on('line', processLine)
        .on('close', () => endParsing(outputFolder));
}
