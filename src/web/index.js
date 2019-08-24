import { solve, getInitialValues } from '../logic'
import { HARD_PUZZLE } from '../logic/sample-puzzles'
import { drawInitialGrid, drawSolution } from './svg'

const onOpenCVLoaded = () => {
  const splashScreenElement = document.querySelector('.splash-screen')
  const containerElement = document.querySelector('.container')
  splashScreenElement.style.display = 'none'
  containerElement.style.display = 'block'
  const puzzle = HARD_PUZZLE
  const initialValues = getInitialValues(puzzle)
  drawInitialGrid(initialValues)
  const solutions = solve(puzzle)
  drawSolution(solutions[0])
}

const headElement = document.querySelector('head')
const scriptElement = document.createElement('script')
scriptElement.setAttribute('src', '/opencv_4.1.1.js')
scriptElement.onload = onOpenCVLoaded
headElement.appendChild(scriptElement)
