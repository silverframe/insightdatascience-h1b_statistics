## Problem

A newspaper editor was researching immigration data trends on `H1B`(`H-1B`, `H-1B1`, `E-3`) visa application processing over the past years, trying to identify the `occupations` and `states` with the `most number of approved H1B visas`. She has found statistics available from the US Department of Labor and its Office of Foreign Labor Certification Performance Data. But while there are ready-made reports for 2018 and 2017, the site doesn’t have them for past years.

As a data engineer, you are asked to create a mechanism to analyze past years data, specificially calculate two metrics: `Top 10 Occupations` and `Top 10 States` for `certified visa applications`.

## Approach
1. Research on requirements by:
    1. Clone and explore the input file and expected output for the given test
    1. Download and explore the [converted semicolon separated files](https://drive.google.com/drive/folders/1Nti6ClUfibsXSQw5PUIWfVGSIrpuwyxf?usp=sharing) for the years 2014, 2015, 2016
    1. As each year of data can have different columns, check `File Structure` docs regarding the relevant columns for the year [2014](https://www.foreignlaborcert.doleta.gov/docs/py2014q4/H1B_FY14_Record_Layout.doc), [2015](https://www.foreignlaborcert.doleta.gov/docs/py2015q4/H-1B_FY15_Record_Layout.docx), [2016](https://www.foreignlaborcert.doleta.gov/docs/Performance_Data/Disclosure/FY15-FY16/H-1B_FY16_Record_Layout.pdf)
    1. Explore the mentioned ready-made reports for [2018](https://www.foreignlaborcert.doleta.gov/pdf/PerformanceData/2018/H-1B_Selected_Statistics_FY2018_Q4.pdf) and [2017](https://www.foreignlaborcert.doleta.gov/pdf/PerformanceData/2017/H-1B_Selected_Statistics_FY2017.pdf)
1. Create function to read semicolon separated file and return as 2D string array, also making sure to support large input file by reading line by line
1. Discover that
    1. Occupations can have input errors, like having space padded for left or right of the string
    1. Same occupations can have different `SOC_NAME` values
    1. States are given in either state code `CA` or city `MOUNTAIN VIEW`
    1. Same states can have different values. For example `WASHINGTON`, `WASHINGTON DC`, `WASHINGTON, D.C`
1. Create exploratory data analysis program to output
    1. `occupation_list.txt` to display unique set of given occupations
    2. `state_list.txt` to display unique set of given states
    3. `missing_occupation.csv` to display records that are missing occupation
    4. `missing_state.csv` to display records that are missing state
1. Create function for trimming away left and right space padding for occupation and state
1. Create function to filter for approved status
1. Create function to aggregate occupation metric
1. Create function to aggregate state metric
1. Create function for generating occupation metric by
    1. Calculating percentage for each occupation
    1. Filter down to top 10 occupation metric
    1. Write the top 10 occupation metric to file
1. Create function for generating state metric by
    1. Calculating percentage for each state
    1. Filter down to top 10 state metric
    1. Write the top 10 state metric to file
1. Write README

## Setup
1. Visit <https://nodejs.org/en/> to install node.js
1. Install project dependencies with the command `npm install` in root folder (Folder that contains package.json)
1. Compile typescript to javascript via the command `npm run build`

## Usage

### Counting metric
In command line/terminal
1. Change directory to root folder of this project
1. Use `node ./src/h1b_counting.js {input_file} {top_10_occupation_output_file} {top_10_state_output_file}`, replacing `input_file`, `top_10_occupation_output_file`, `top_10_state_output_file` to the appropriate paths like `node ./src/h1b_counting.js ./input/h1b_input.csv ./output/top_10_occupations.txt ./output/top_10_states.txt`

### Exploratory data analysis
In command line/terminal
1. Change directory to root folder of this project
1. Use `node ./src/eda.js {input_file} {output_folder}`, replacing `input_file`, `output_folder` to the appropriate paths like `node ./src/eda.js ./input/H1B_FY_2014.csv ./eda`

## Assumption
1. Assumed for all records found in CSV are for `H1B` visa
1. Dropped missing occupation or state records

## Improvement for the future
1. Find a way to group a given occupation to a common occupation so it will more accurately group records that has same occupation. For example, both `Computer Programmers Non R & D` and `Computer Programmer Non R & D` are found in 2014
1. Find a way to group records that is for same city but entered with different variations. For example `WASHINGTON`, `WASHINGTON DC`, `WASHINGTON, D.C`
1. Determine which state the records are in when only city is given. For example `MOUNTAIN VIEW` is a city of `CA`
