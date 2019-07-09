import { solve, getInitialValues } from '../logic'
import { HARD_PUZZLE } from '../logic/sample-puzzles'
import { drawInitialGrid, drawSolution } from './svg'

const puzzle = HARD_PUZZLE

const initialValues = getInitialValues(puzzle)
drawInitialGrid(initialValues)

const solutions = solve(puzzle)
drawSolution(solutions[0])
