import * as fs from 'fs'

export const DELIMITER = ';'
export const VALID_OCCUPATION_KEY = ['LCA_CASE_SOC_NAME', 'SOC_NAME']
export const VALID_STATE_KEY = ['LCA_CASE_WORKLOC1_STATE', 'WORKSITE_STATE']

export type Occupation = string
export type State = string

export type OccupationMetric = {
    occupation: Occupation,
    count: number,
}
export type StateMetric = {
    state: State,
    count: number,
}

export const writeArray = (arr: string[], outputPath: string) => fs.writeFileSync(outputPath, arr.join("\n"))

export const writeCSV = (path: string, headers: string[], rows: string[][], delimiter: string) => {
    let lines = [headers.join(delimiter)]
    lines = lines.concat(rows.map(row => row.join(delimiter)))
    fs.writeFileSync(path, lines.join("\n"))
}

export const isApproved = (row) => {
    const VALID_STATUS_KEY = ['STATUS', 'CASE_STATUS']
    const VALID_APPROVED_STATUS = ['CERTIFIED', 'CERTIFIED-WITHDRAWN']
    for (const key of VALID_STATUS_KEY) {
        if (key in row) {
            return VALID_APPROVED_STATUS.indexOf(row[key].toUpperCase()) >= 0
        }
    }
    return false
}

export const sanitizeOccupation = (value: Occupation) => value.trim()

export const sanitizeState = (value: State) => value.trim()

export const intersect = (arr1: any[], arr2: any[]) => arr1.filter(value => -1 !== arr2.indexOf(value))