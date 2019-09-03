import { drawInitialValues, drawSolution } from './drawSvg'

export const hideSplashContent = () => {
  const splashContentElement = document.querySelector('.splash-content')
  splashContentElement.style.display = 'none'
}

export const showMainContent = () => {
  const mainContentElement = document.querySelector('.main-content')
  mainContentElement.style.display = 'block'
}

const videoElement = document.getElementById('video')
const videoOverlayGuidesElement = document.getElementById('video-overlay-guides')
const videoOverlayInstructionsElement = document.getElementById('video-overlay-instructions')
const canvasElement = document.getElementById('canvas')
const sudokuElement = document.getElementById('sudoku')

export const DISPLAY_MODE_INSTRUCTIONS = Symbol('DISPLAY_MODE_INSTRUCTIONS')
export const DISPLAY_MODE_VIDEO = Symbol('DISPLAY_MODE_VIDEO')
export const DISPLAY_MODE_CANVAS = Symbol('DISPLAY_MODE_CANVAS')
export const DISPLAY_MODE_SUDOKU = Symbol('DISPLAY_MODE_SUDOKU')

export const setDisplayMode = displayMode => {
  const showOrHide = (element, ...displayModes) => {
    const show = displayModes.includes(displayMode)
    element.style.display = show ? 'block' : 'none'
  }
  showOrHide(videoElement, DISPLAY_MODE_INSTRUCTIONS, DISPLAY_MODE_VIDEO)
  showOrHide(videoOverlayGuidesElement, DISPLAY_MODE_VIDEO)
  showOrHide(videoOverlayInstructionsElement, DISPLAY_MODE_INSTRUCTIONS)
  showOrHide(canvasElement, DISPLAY_MODE_CANVAS)
  showOrHide(sudokuElement, DISPLAY_MODE_SUDOKU)
}

export const drawPuzzle = (initialValues, solutions) => {
  drawInitialValues(sudokuElement, initialValues)
  if (solutions.length === 1) {
    drawSolution(sudokuElement, solutions[0])
  }
}

export const setVideoClickHandler = handler => {
  videoElement.addEventListener('click', () =>
    handler({ videoElement, canvasElement, sudokuElement }))
}

export const setSudokuClickHandler = handler => {
  sudokuElement.addEventListener('click', () =>
    handler({ videoElement, canvasElement, sudokuElement }))
}
