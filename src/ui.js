import { drawInitialValues, drawSolution } from './drawSvg'

export const hideSplashContent = () => {
  const splashContentElement = document.querySelector('.splash-content')
  splashContentElement.style.display = 'none'
}

export const showMainContent = () => {
  const mainContentElement = document.querySelector('.main-content')
  mainContentElement.style.display = 'block'
}

const cancelButton = document.getElementById('cancel-btn')
const videoElement = document.getElementById('video')
const videoOverlayGuidesElement = document.getElementById('video-overlay-guides')
const videoOverlayInstructionsElement = document.getElementById('video-overlay-instructions')
const solutionElement = document.getElementById('solution')

export const DISPLAY_MODE_INSTRUCTIONS = Symbol('DISPLAY_MODE_INSTRUCTIONS')
export const DISPLAY_MODE_VIDEO = Symbol('DISPLAY_MODE_VIDEO')
export const DISPLAY_MODE_SOLUTION = Symbol('DISPLAY_MODE_SOLUTION')

export const setDisplayMode = displayMode => {
  const showOrHide = (element, ...displayModes) => {
    const show = displayModes.includes(displayMode)
    element.style.display = show ? 'block' : 'none'
  }
  showOrHide(videoElement, DISPLAY_MODE_INSTRUCTIONS, DISPLAY_MODE_VIDEO)
  showOrHide(videoOverlayGuidesElement, DISPLAY_MODE_VIDEO)
  showOrHide(videoOverlayInstructionsElement, DISPLAY_MODE_INSTRUCTIONS)
  showOrHide(solutionElement, DISPLAY_MODE_SOLUTION)
}

export const drawPuzzle = (initialValues, solution) => {
  drawInitialValues(solutionElement, initialValues)
  drawSolution(solutionElement, solution)
}

export const setVideoClickHandler = handler => {
  videoElement.addEventListener('click', () =>
    handler({
      videoElement,
      videoOverlayGuidesElement,
      solutionElement
    }))
}

export const showCancelButton = handler => {
  cancelButton.style.display = 'block'
  cancelButton.addEventListener('click', handler)
}

export const hideCancelButton = handler => {
  cancelButton.style.display = 'none'
  cancelButton.removeEventListener('click', handler)
}

export const setSudokuClickHandler = handler => {
  solutionElement.addEventListener('click', () =>
    handler({
      videoElement,
      videoOverlayGuidesElement,
      solutionElement
    }))
}
