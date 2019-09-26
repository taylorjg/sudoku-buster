import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'
import Stats from 'stats.js'
import queryString from 'query-string'
import axios from 'axios'
import * as UI from './ui'
import { imageTensorToDataURL } from './image'
import { loadModels, getCellsModel } from './models'
import { isWebcamStarted, startWebcam, stopWebcam, captureWebcam } from './webcam'
import { scanPuzzle } from './scan'
import { satisfiesAllConstraints, digitPredictionsToPuzzle } from './puzzle'
import { getInitialValues, solve } from './solve'
import { showErrorPanel, hideErrorPanel } from './errorPanel'
import { version } from '../package.json'

const queryParams = queryString.parse(location.search)

const scanPuzzleOptions = {
  drawContour: queryParams['c'] !== undefined,
  drawCorners: queryParams['cs'] !== undefined,
  drawBoundingBox: queryParams['bb'] !== undefined,
  drawGridSquares: queryParams['gs'] !== undefined
}

const fpsOn = queryParams['fps'] !== undefined
let stats = undefined

const showStats = () => {
  if (fpsOn) {
    stats = new Stats()
    document.body.appendChild(stats.dom)
  }
}

const hideStats = () => {
  if (fpsOn && stats) {
    document.body.removeChild(stats.dom)
    stats = undefined
  }
}

let startTime = 0
let frameCount = 0
let markss = []

const resetScanMetrics = () => {
  startTime = performance.now()
  frameCount = 0
  markss = []
}

const saveScanMetrics = async (outcome, imageDataURL, solution) => {
  try {
    const config = {
      headers: {
        'content-type': 'application/json'
      }
    }
    const duration = performance.now() - startTime
    const timestamp = new Date().getTime()
    const data = {
      version,
      timestamp,
      outcome,
      duration,
      frameCount,
      markss: markss.slice(-100),
      imageDataURL,
      solution
    }
    await axios.post('/api/scanMetrics', JSON.stringify(data), config)
  } catch (error) {
    log.error(`[postScanMetrics] ${error}`)
  }
}

const logPerformanceMetrics = async () => {
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
  frameCount++
  markss.push(marks)
}

const processImage = async (imageTensor, svgElement) => {
  try {
    const digitPredictions = await scanPuzzle(getCellsModel(), imageTensor, svgElement, scanPuzzleOptions)
    performance.mark('scanPuzzle')
    // https://en.wikipedia.org/wiki/Mathematics_of_Sudoku#Ordinary_Sudoku
    if (digitPredictions.length < 17) return
    if (!satisfiesAllConstraints(digitPredictions)) return
    performance.mark('satisfiesAllConstraints')
    const puzzle = digitPredictionsToPuzzle(digitPredictions)
    const initialValues = getInitialValues(puzzle)
    const solutions = solve(puzzle, { numSolutions: 1 })
    performance.mark('solve')
    if (solutions.length !== 1) return
    const solution = solutions[0]
    UI.setDisplayMode(UI.DISPLAY_MODE_SOLUTION)
    UI.drawPuzzle(initialValues, solution)
    performance.mark('drawPuzzle')
    const imageDataURL = await imageTensorToDataURL(imageTensor)
    return {
      imageDataURL,
      solution // [{coords, value, isInitialValue}]
    }
  } catch (error) {
    log.error(`[processImage] ${error.message}`)
    if (!error.isScanException) {
      showErrorPanel(error.message)
    }
    return
  }
}

const onVideoClick = async elements => {

  if (isWebcamStarted()) {
    stopWebcam()
    UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)
    hideStats()
    await saveScanMetrics('cancelled')
    return
  }

  try {
    hideErrorPanel()
    resetScanMetrics()
    await startWebcam(elements.videoElement)
    UI.setDisplayMode(UI.DISPLAY_MODE_VIDEO)
    showStats()
  } catch (error) {
    log.error(`[onVideoClick] ${error.message}`)
    showErrorPanel(error)
    return
  }

  let result = false

  while (isWebcamStarted()) {
    const disposables = []
    try {
      stats && stats.begin()
      performance.clearMarks()
      const gridImageTensor = await captureWebcam()
      performance.mark('captureWebcam')
      if (!gridImageTensor) break
      disposables.push(gridImageTensor)
      result = await processImage(gridImageTensor, elements.videoOverlayGuidesElement)
      if (result) break
    } finally {
      disposables.forEach(disposable => disposable.dispose())
      logPerformanceMetrics()
      stats && stats.end()
    }
    log.info('[onVideoClick] waiting for next frame...')
    await tf.nextFrame()
  }

  stopWebcam()
  hideStats()

  if (result) {
    await saveScanMetrics('completed', result.imageDataURL, result.solution)
  }

  log.info(`[onVideoClick] tf memory: ${JSON.stringify(tf.memory())}`)
}

const onSudokuClick = () =>
  UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)

UI.setVideoClickHandler(onVideoClick)
UI.setSudokuClickHandler(onSudokuClick)

const waitForOpenCVToFinishRunning = async () => {
  for (; ;) {
    if (cv && cv.Mat) {
      log.info('[waitForOpenCVToFinishRunning] done')
      return
    }
    log.info('[waitForOpenCVToFinishRunning] waiting...')
    await new Promise(resolve => setTimeout(resolve, 2))
  }
}

const onOpenCVLoaded = async () => {
  await loadModels()
  log.info(`[onOpenCVLoaded] tf memory: ${JSON.stringify(tf.memory())}`)
  await waitForOpenCVToFinishRunning()
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
