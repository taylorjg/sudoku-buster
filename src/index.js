import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'
import * as I from './image'
import * as UI from './ui'
import { loadModels, getCellsModel } from './models'
import { isWebcamStarted, startWebcam, stopWebcam, captureWebcam } from './webcam'
import { scanPuzzle } from './scan'
import { getInitialValues, solve } from './solve'
import { showErrorPanel } from './errorPanel'

const processImage = async gridImageTensor => {
  try {
    const imageData = await I.imageTensorToImageData(gridImageTensor)
    const puzzle = await scanPuzzle(getCellsModel(), imageData)
    if (!puzzle) return false
    const initialValues = getInitialValues(puzzle)
    const solutions = solve(puzzle)
    if (solutions.length !== 1) return false
    UI.setDisplayMode(UI.DISPLAY_MODE_SUDOKU)
    UI.drawPuzzle(initialValues, solutions[0])
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
  }

  try {
    await startWebcam(elements.videoElement)
    UI.setDisplayMode(UI.DISPLAY_MODE_VIDEO)
  } catch (error) {
    log.error(`[onVideoClick] ${error.message}`)
    showErrorPanel(error)
    return
  }

  while (isWebcamStarted()) {
    const disposables = []
    try {
      const gridImageTensor = await captureWebcam()
      if (!gridImageTensor) break
      disposables.push(gridImageTensor)
      const result = await processImage(gridImageTensor)
      if (result) break
    } finally {
      disposables.forEach(disposable => disposable.dispose())
    }
    log.info('[onVideoClick] waiting for next frame...')
    await tf.nextFrame()
  }

  stopWebcam()
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
