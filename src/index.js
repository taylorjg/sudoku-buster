import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'
import * as I from './image'
import * as UI from './ui'
import { loadModels, getBlanksModel, getDigitsModel } from './models'
import { isWebcamStarted, startWebcam, stopWebcam, captureWebcam } from './webcam'
import { scanPuzzle } from './scan'
import { getInitialValues, solve } from './solve'

const processImage = async gridImageTensor => {
  try {
    log.info(`[processImage] gridImageTensor.shape: ${gridImageTensor.shape}`)
    const imageData = await I.imageTensorToImageData(gridImageTensor)
    const puzzle = await scanPuzzle(getBlanksModel(), getDigitsModel(), imageData)
    if (!puzzle) {
      return false
    }
    const initialValues = getInitialValues(puzzle)
    const solutions = solve(puzzle)
    if (solutions.length !== 1) {
      return false
    }
    UI.setDisplayMode(UI.DISPLAY_MODE_SUDOKU)
    UI.drawPuzzle(initialValues, solutions)
    return true
  } catch (error) {
    return false
  }
}

const onVideoClick = async elements => {
  if (isWebcamStarted()) {
    stopWebcam()
    UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)
    return
  } else {
    await startWebcam(elements.videoElement)
    UI.setDisplayMode(UI.DISPLAY_MODE_VIDEO)
  }
  for (; ;) {
    if (!isWebcamStarted()) {
      return
    }
    const disposables = []
    try {
      const gridImageTensor = await captureWebcam()
      disposables.push(gridImageTensor)
      const result = await processImage(gridImageTensor)
      if (result) {
        stopWebcam()
        break
      }
    } finally {
      disposables.forEach(disposable => disposable.dispose())
    }
    log.info('[onVideoClick] waiting for next frame...')
    await tf.nextFrame()
  }
  log.info(`[onVideoClick] tf memory: ${JSON.stringify(tf.memory())}`)
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
