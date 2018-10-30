#!/usr/bin/env node

import * as fs from 'fs'
import * as readline from 'readline'

import {
    DELIMITER,
    VALID_OCCUPATION_KEY,
    VALID_STATE_KEY,
    Occupation,
    OccupationMetric,
    State,
    StateMetric,
    isApproved,
    sanitizeOccupation,
    sanitizeState,
    intersect,
} from './common'

const occupationMetrics = new Map<Occupation, OccupationMetric>()
const stateMetrics = new Map<State, StateMetric>()
let headers = []

const main = (inputPath: string, occupationOutputPath: string, stateOutputPath: string) =>
    readline.createInterface({
        input: fs.createReadStream(inputPath, 'utf8'),
    })
        .on('line', processLine)
        .on('close', () => endParsing(occupationOutputPath, stateOutputPath))

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

const endParsing = (occupationOutputPath: string, stateOutputPath: string) => {
    /* Required Output - Start */
    writeOccupationMetrics(occupationOutputPath, occupationMetrics)
    writeStateMetrics(stateOutputPath, stateMetrics)
    /* Required Output - End */
}

const processForOccupationMetric = (row: {}) => {
    const keys = intersect(VALID_OCCUPATION_KEY, Object.keys(row))
    if (keys.length == 0) { return }

    const occupation = sanitizeOccupation(row[keys[0]])
    if (occupation === '') { return }
    
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
    if (state === '') { return }

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

const writeOccupationMetrics = (outputPath: string, occupationMetrics: Map<Occupation, OccupationMetric>) => {
    const total = [...occupationMetrics.values()].reduce((p, v, i, a) => { return p + v.count }, 0)
    const metrics = [...occupationMetrics.values()].map(metric => ({
        ...metric,
        percentage: metric.count / total * 100,
    }))
    metrics.sort((a, b) => {
        if (b.count === a.count) {
            return a.occupation.toLocaleLowerCase() > b.occupation.toLocaleLowerCase() ? 1 : -1
        }
        return b.count - a.count
    })
    let lines = ['TOP_OCCUPATIONS;NUMBER_CERTIFIED_APPLICATIONS;PERCENTAGE'] // header
    metrics.slice(0, 10).forEach(metric => {
        lines.push(`${metric.occupation};${metric.count};${metric.percentage.toFixed(1)}%`)
    })
    fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
}

const writeStateMetrics = (outputPath: string, stateMetrics: Map<State, StateMetric>) => {
    const total = [...stateMetrics.values()].reduce((p, v, i, a) => { return p + v.count }, 0)
    const metrics = [...stateMetrics.values()].map(metric => ({
        ...metric,
        percentage: metric.count / total * 100,
    }))
    metrics.sort((a, b) => {
        if (b.count === a.count) {
            return a.state.toLocaleLowerCase() > b.state.toLocaleLowerCase() ? 1 : -1
        }
        return b.count - a.count
    })
    let lines = ['TOP_STATES;NUMBER_CERTIFIED_APPLICATIONS;PERCENTAGE'] // header
    metrics.slice(0, 10).forEach(metric => {
        lines.push(`${metric.state};${metric.count};${metric.percentage.toFixed(1)}%`)
    })
    fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
}

if (typeof require != 'undefined' && require.main==module) {
    const args = process.argv.slice(2)
    const inputPath = args[0]
    const occupationOutputPath = args[1]
    const stateOutputPath = args[2]
    main(inputPath, occupationOutputPath, stateOutputPath)
}