import * as tf from '@tensorflow/tfjs'
import { solve, getInitialValues } from '../logic'
import * as SP from '../logic/sample-puzzles'
import { drawInitialGrid, drawSolution } from './svg'

const hideSplashContent = () => {
  const splashContentElement = document.querySelector('.splash-content')
  splashContentElement.style.display = 'none'
}

const showMainContent = () => {
  const mainContentElement = document.querySelector('.main-content')
  mainContentElement.style.display = 'block'
}

const solveSamplePuzzle = () => {
  const puzzle = SP.HARD_PUZZLE
  const initialValues = getInitialValues(puzzle)
  drawInitialGrid(initialValues)
  const solutions = solve(puzzle)
  drawSolution(solutions[0])
}

const videoElement = document.getElementById('video')
const canvasElement = document.getElementById('canvas')
const sudokuElement = document.getElementById('sudoku')
let webcam = undefined

const DISPLAY_MODE_VIDEO = Symbol('DISPLAY_MODE_VIDEO')
const DISPLAY_MODE_CANVAS = Symbol('DISPLAY_MODE_CANVAS')
const DISPLAY_MODE_SUDOKU = Symbol('DISPLAY_MODE_SUDOKU')

const setDisplayMode = displayMode => {
  videoElement.style.display = displayMode === DISPLAY_MODE_VIDEO ? 'block' : 'none'
  canvasElement.style.display = displayMode === DISPLAY_MODE_CANVAS ? 'block' : 'none'
  sudokuElement.style.display = displayMode === DISPLAY_MODE_SUDOKU ? 'block' : 'none'
}

const onClickVideo = async () => {
  if (webcam) {
    const imageTensor = await webcam.capture()
    webcam.stop()
    webcam = undefined // eslint-disable-line
    setDisplayMode(DISPLAY_MODE_CANVAS)
    tf.browser.toPixels(imageTensor, canvasElement)
  } else {
    setDisplayMode(DISPLAY_MODE_VIDEO)
    const videoRect = videoElement.getBoundingClientRect()
    const webcamConfig = {
      facingMode: 'environment',
      resizeWidth: videoRect.width,
      resizeHeight: videoRect.height
    }
    videoElement.width = videoRect.width
    videoElement.height = videoRect.height
    webcam = await tf.data.webcam(videoElement, webcamConfig) //eslint-disable-line
  }
}

const onClickCanvas = () => {
  setDisplayMode(DISPLAY_MODE_SUDOKU)
  solveSamplePuzzle()
}

const onClickSudoku = () => {
  setDisplayMode(DISPLAY_MODE_VIDEO)
}

videoElement.addEventListener('click', onClickVideo)
canvasElement.addEventListener('click', onClickCanvas)
sudokuElement.addEventListener('click', onClickSudoku)

const onOpenCVLoaded = () => {
  hideSplashContent()
  showMainContent()
}

const loadOpenCV = () => {
  const headElement = document.querySelector('head')
  const scriptElement = document.createElement('script')
  scriptElement.setAttribute('src', '/opencv_4.1.1.js')
  scriptElement.onload = onOpenCVLoaded
  headElement.appendChild(scriptElement)
}

const main = () => {
  loadOpenCV()
}

main()
