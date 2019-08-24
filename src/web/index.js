import { solve, getInitialValues } from '../logic'
import { HARD_PUZZLE } from '../logic/sample-puzzles'
import { drawInitialGrid, drawSolution } from './svg'

const onOpenCVLoaded = () => {
  const splashContentElement = document.querySelector('.splash-content')
  const mainContentElement = document.querySelector('.main-content')
  splashContentElement.style.display = 'none'
  mainContentElement.style.display = 'block'
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
