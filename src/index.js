import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'
import * as I from './image'
import * as UI from './ui'
import { loadModels, getBlanksModel, getDigitsModel } from './models'
import { isWebcamStarted, startWebcam, captureWebcam } from './webcam'
import { scanPuzzle } from './scan'
import { getInitialValues, solve } from './solve'
import { showErrorPanel, hideErrorPanel } from './errorPanel'

const processImage = async (gridImageTensor, canvasElement) => {
  try {
    log.info(`[processImage] gridImageTensor.shape: ${gridImageTensor.shape}`)
    UI.setDisplayMode(UI.DISPLAY_MODE_CANVAS)
    const imageData = await I.imageTensorToImageData(gridImageTensor, canvasElement)
    const puzzle = await scanPuzzle(getBlanksModel(), getDigitsModel(), imageData)
    if (!puzzle) {
      UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)
      return
    }
    UI.setDisplayMode(UI.DISPLAY_MODE_SUDOKU)
    const initialValues = getInitialValues(puzzle)
    const solutions = solve(puzzle)
    UI.drawPuzzle(initialValues, solutions)
  } catch (error) {
    log.error(`[processImage] ${error.message}`)
    showErrorPanel(error.message)
    UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)
  }
}

const onVideoClick = async elements => {
  if (isWebcamStarted()) {
    const gridImageTensor = await captureWebcam()
    await processImage(gridImageTensor, elements.canvasElement)
    gridImageTensor.dispose()
    log.info(`[onVideoClick] tf memory: ${JSON.stringify(tf.memory())}`)
  } else {
    hideErrorPanel()
    startWebcam(elements.videoElement)
    UI.setDisplayMode(UI.DISPLAY_MODE_VIDEO)
  }
}

const onSudokuClick = () =>
  UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)

UI.setVideoClickHandler(onVideoClick)
UI.setSudokuClickHandler(onSudokuClick)

const onOpenCVLoaded = async () => {
  await loadModels()
  log.info(`[onOpenCVLoaded] tf memory: ${JSON.stringify(tf.memory())}`)
  UI.hideSplashContent()
  UI.showMainContent()
  UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)
}

const loadOpenCV = () => {
  const headElement = document.querySelector('head')
  const scriptElement = document.createElement('script')
  scriptElement.setAttribute('src', '/opencv.js')
  scriptElement.onload = onOpenCVLoaded
  headElement.appendChild(scriptElement)
}

const main = () => {
  window.log = log
  loadOpenCV()
}

main()
