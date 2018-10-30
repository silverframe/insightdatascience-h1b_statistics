#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const readline = require("readline");
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
const writeOccupationMetrics = (outputPath, occupationMetrics) => {
    const total = [...occupationMetrics.values()].reduce((p, v, i, a) => { return p + v.count; }, 0);
    const metrics = [...occupationMetrics.values()].map(metric => (Object.assign({}, metric, { percentage: metric.count / total * 100 })));
    metrics.sort((a, b) => {
        if (b.count === a.count) {
            return a.occupation.toLocaleLowerCase() > b.occupation.toLocaleLowerCase() ? 1 : -1;
        }
        return b.count - a.count;
    });
    let lines = ['TOP_OCCUPATIONS;NUMBER_CERTIFIED_APPLICATIONS;PERCENTAGE'];
    metrics.slice(0, 10).forEach(metric => {
        lines.push(`${metric.occupation};${metric.count};${metric.percentage.toFixed(1)}%`);
    });
    fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
};
const writeStateMetrics = (outputPath, stateMetrics) => {
    const total = [...stateMetrics.values()].reduce((p, v, i, a) => { return p + v.count; }, 0);
    const metrics = [...stateMetrics.values()].map(metric => (Object.assign({}, metric, { percentage: metric.count / total * 100 })));
    metrics.sort((a, b) => {
        if (b.count === a.count) {
            return a.state.toLocaleLowerCase() > b.state.toLocaleLowerCase() ? 1 : -1;
        }
        return b.count - a.count;
    });
    let lines = ['TOP_STATES;NUMBER_CERTIFIED_APPLICATIONS;PERCENTAGE'];
    metrics.slice(0, 10).forEach(metric => {
        lines.push(`${metric.state};${metric.count};${metric.percentage.toFixed(1)}%`);
    });
    fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
};
const endParsing = (occupationOutputPath, stateOutputPath) => {
    /* Required Output - Start */
    writeOccupationMetrics(occupationOutputPath, occupationMetrics);
    writeStateMetrics(stateOutputPath, stateMetrics);
    /* Required Output - End */
};
if (typeof require != 'undefined' && require.main == module) {
    const args = process.argv.slice(2);
    const inputPath = args[0];
    const occupationOutputPath = args[1];
    const stateOutputPath = args[2];
    readline.createInterface({
        input: fs.createReadStream(inputPath, 'utf8'),
    })
        .on('line', processLine)
        .on('close', () => endParsing(occupationOutputPath, stateOutputPath));
}
