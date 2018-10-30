#!/usr/bin/env node

import * as fs from 'fs'
import * as readline from 'readline'
import * as path from 'path'

import {
    DELIMITER,
    VALID_OCCUPATION_KEY,
    VALID_STATE_KEY,
    Occupation,
    OccupationMetric,
    State,
    StateMetric,
    writeArray,
    writeCSV,
    isApproved,
    sanitizeOccupation,
    sanitizeState,
    intersect,
} from './common'

const occupationMetrics = new Map<Occupation, OccupationMetric>()
const stateMetrics = new Map<State, StateMetric>()
const missingOccupationRows = new Map<string, {}>()
const missingStateRows = new Map<string, {}>()
let headers = []

const main = (inputPath: string, outputFolder: string) =>
    readline.createInterface({
        input: fs.createReadStream(inputPath, 'utf8'),
    })
        .on('line', processLine)
        .on('close', () => endParsing(outputFolder))

const processLine = (line: string) => {
    const re = new RegExp('^"(.*)"$');
    const cells = line.split(DELIMITER).map(cell => {
        const match = cell.match(re)
        if (match) {
            return match[1] // handle string in quotes
        } else {
            return cell
        }
    })
    if (headers.length === 0) {
        headers = cells
    } else {
        const row = {}
        headers.forEach((header, index) => {
            row[header] = cells[index]
        })
        if (isApproved(row)) {
            // TODO should we impute missing occupations?
            // TODO should we filter by H1B visa?
            processForOccupationMetric(row)
            processForStateMetric(row)
        }
    }
}

const endParsing = (outputFolder: string) => {
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder)
    }

    /* EDA - start */
    // list all occupations
    const occupations = [...occupationMetrics.keys()]
    occupations.sort()
    writeArray(occupations, path.join(outputFolder, 'occupation_list.txt'))

    // list all states
    const states = [...stateMetrics.keys()]
    states.sort()
    writeArray(states, path.join(outputFolder, 'state_list.txt'))

    // list all rows with missing occupation
    const missingOccupations = [...missingOccupationRows.values()]
    if (missingOccupations.length > 0) {
        const headers = Object.keys(missingOccupations[0])
        const rows = missingOccupations.map(occupation => headers.map(header => String(occupation[header])))
        writeCSV(path.join(outputFolder, 'missing_occupation.csv'), headers, rows, DELIMITER)
    }

    // list all rows with missing state
    const missingStates = [...missingStateRows.values()]
    if (missingStates.length > 0) {
        const headers = Object.keys(missingStates[0])
        const rows = missingStates.map(state => headers.map(header => String(state[header])))
        writeCSV(path.join(outputFolder, 'missing_states.csv'), headers, rows, DELIMITER)
    }
    /* EDA - End */
}

const processForOccupationMetric = (row: {}) => {
    const keys = intersect(VALID_OCCUPATION_KEY, Object.keys(row))
    if (keys.length == 0) { return }
    
    const occupation = sanitizeOccupation(row[keys[0]])
    if (occupation === '') {
        missingOccupationRows.set(row[''], row)
        return
    }
    
    if (!occupationMetrics.has(occupation)) {
        occupationMetrics.set(occupation, {
            occupation,
            count: 1,
        })
    } else {
        const occupationMetric = occupationMetrics.get(occupation)
        occupationMetric.count++
    }
}

const processForStateMetric = (row: {}) => {
    const keys = intersect(VALID_STATE_KEY, Object.keys(row))
    if (keys.length == 0) { return }

    const state = sanitizeState(row[keys[0]])
    if (state === '') {
        missingStateRows.set(row[''], row)
        return
    }

    if (!stateMetrics.has(state)) {
        stateMetrics.set(state, {
            state,
            count: 1,
        })
    } else {
        const stateMetric = stateMetrics.get(state)
        stateMetric.count++
    }
}

if (typeof require != 'undefined' && require.main==module) {
    const args = process.argv.slice(2)
    const inputPath = args[0]
    const outputFolder = args[1]
    main(inputPath, outputFolder)
}