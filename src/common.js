"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
exports.DELIMITER = ';';
exports.VALID_OCCUPATION_KEY = ['LCA_CASE_SOC_NAME', 'SOC_NAME'];
exports.VALID_STATE_KEY = ['LCA_CASE_WORKLOC1_STATE', 'WORKSITE_STATE'];
exports.writeArray = (arr, outputPath) => fs.writeFileSync(outputPath, arr.join("\n"));
exports.writeCSV = (path, headers, rows, delimiter) => {
    let lines = [headers.join(delimiter)];
    lines = lines.concat(rows.map(row => row.join(delimiter)));
    fs.writeFileSync(path, lines.join("\n"));
};
exports.isApproved = (row) => {
    const VALID_STATUS_KEY = ['STATUS', 'CASE_STATUS'];
    const VALID_APPROVED_STATUS = ['CERTIFIED', 'CERTIFIED-WITHDRAWN'];
    for (const key of VALID_STATUS_KEY) {
        if (key in row) {
            return VALID_APPROVED_STATUS.indexOf(row[key].toUpperCase()) >= 0;
        }
    }
    return false;
};
exports.sanitizeOccupation = (value) => value.trim();
exports.sanitizeState = (value) => value.trim();
