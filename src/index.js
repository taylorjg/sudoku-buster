import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'
import queryString from 'query-string'
import * as I from './image'
import * as UI from './ui'
import { loadModels, getCellsModel } from './models'
import { isWebcamStarted, startWebcam, stopWebcam, captureWebcam } from './webcam'
import { scanPuzzle } from './scan'
import { satisfiesAllConstraints, digitPredictionsToPuzzle } from './puzzle'
import { getInitialValues, solve } from './solve'
import { showErrorPanel, hideErrorPanel } from './errorPanel'

const queryParams = queryString.parse(location.search)

const scanPuzzleOptions = {
  drawBoundingBox: queryParams['bb'] !== undefined,
  drawContour: queryParams['c'] !== undefined
}

const logPerformanceMetrics = () => {
  const marks = performance.getEntriesByType('mark')
  if (marks.length === 0) return
  const firstStartTime = marks[0].startTime
  const transformedMarks = marks
    .map(({ name, startTime }, index) => ({
      name,
      sinceFirstStartTime: (startTime - firstStartTime).toFixed(2),
      sincePreviousStartTime: (index > 0 ? startTime - marks[index - 1].startTime : 0).toFixed(2)
    }))
  transformedMarks.forEach(mark => log.info(JSON.stringify(mark)))
}

const processImage = async (gridImageTensor, svgElement) => {
  try {
    const digitPredictions = await scanPuzzle(getCellsModel(), gridImageTensor, svgElement, scanPuzzleOptions)
    performance.mark('after scanPuzzle')
    // https://en.wikipedia.org/wiki/Mathematics_of_Sudoku#Ordinary_Sudoku
    if (digitPredictions.length < 17) return false
    if (!satisfiesAllConstraints(digitPredictions)) return false
    performance.mark('after satisfiesAllConstraints')
    const puzzle = digitPredictionsToPuzzle(digitPredictions)
    const initialValues = getInitialValues(puzzle)
    const solutions = solve(puzzle, { numSolutions: 1 })
    performance.mark('after solve')
    if (solutions.length !== 1) return false
    UI.setDisplayMode(UI.DISPLAY_MODE_SOLUTION)
    UI.drawPuzzle(initialValues, solutions[0])
    performance.mark('after drawPuzzle')
    return true
  } catch (error) {
    log.error(`[processImage] ${error.message}`)
    if (!error.isScanException) {
      showErrorPanel(error.message)
    }
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
    hideErrorPanel()
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
      performance.clearMarks()
      const gridImageTensor = await captureWebcam()
      performance.mark('after captureWebcam')
      if (!gridImageTensor) break
      disposables.push(gridImageTensor)
      const result = await processImage(gridImageTensor, elements.videoOverlayGuidesElement)
      if (result) break
    } finally {
      disposables.forEach(disposable => disposable.dispose())
      logPerformanceMetrics()
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
