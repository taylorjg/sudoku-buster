import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'
import Stats from 'stats.js'
import axios from 'axios'
import * as UI from './ui'
import { imageDataToDataURL } from './image'
import { helloModuleLoaded } from './findBoundingBox'
import { loadModels, getCellsModel } from './models'
import { isWebcamStarted, startWebcam, stopWebcam, captureWebcam } from './webcam'
import { scanPuzzle } from './scan'
import { satisfiesAllConstraints, digitPredictionsToPuzzle } from './puzzle'
import { getInitialValues, solve } from './solve'
import { showErrorPanel, hideErrorPanel } from './errorPanel'
import packagejson from '../package.json'

const searchParams = new URLSearchParams(location.search)

const scanPuzzleOptions = {
  drawContour: searchParams.has('c'),
  drawCorners: searchParams.has('cs'),
  drawBoundingBox: searchParams.has('bb'),
  drawGridSquares: searchParams.has('gs')
}

const fpsOn = searchParams.has('fps')
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
    const duration = performance.now() - startTime
    const timestamp = new Date().getTime()
    const fps = frameCount / (duration / 1000)
    const version = packagejson.version
    const data = {
      version,
      timestamp,
      outcome,
      duration,
      frameCount,
      fps,
      markss: markss.slice(-100),
      imageDataURL,
      solution
    }
    await axios.post('/api/scanMetrics', data)
  } catch (error) {
    log.error(`[saveScanMetrics] ${error.message}`)
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

const processImage = async (imageData, svgElement) => {
  try {
    const digitPredictions = await scanPuzzle(getCellsModel(), imageData, svgElement, scanPuzzleOptions)
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
    const imageDataURL = imageDataToDataURL(imageData)
    return {
      imageDataURL,
      solution
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
    log.info('[onVideoClick] webcam already started - bailing')
    return
  }

  try {
    hideErrorPanel()
    resetScanMetrics()
    await startWebcam(elements.videoElement)
    UI.setDisplayMode(UI.DISPLAY_MODE_VIDEO)
    UI.showCancelButton(onCancel)
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
      const imageData = await captureWebcam()
      performance.mark('captureWebcam')
      if (!imageData) break
      result = await processImage(imageData, elements.videoOverlayGuidesElement)
      if (result) break
    } catch (error) {
      log.error(`[onVideoClick] ${error.message}`)
      showErrorPanel(error)
    } finally {
      disposables.forEach(disposable => disposable.dispose())
      logPerformanceMetrics()
      stats && stats.end()
    }
    log.info('[onVideoClick] waiting for next frame...')
    await tf.nextFrame()
  }

  if (result && isWebcamStarted()) {
    try {
      UI.hideCancelButton(onCancel)
      stopWebcam()
      hideStats()
      await saveScanMetrics('completed', result.imageDataURL, result.solution)
    } catch (error) {
      log.error(`[onVideoClick] ${error.message}`)
      showErrorPanel(error.message)
    }
  }

  log.info(`[onVideoClick] tf memory: ${JSON.stringify(tf.memory())}`)
}

const onCancel = async () => {
  try {
    UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)
    UI.hideCancelButton(onCancel)
    stopWebcam()
    hideStats()
    await saveScanMetrics('cancelled')
  } catch (error) {
    log.error(`[onCancel] ${error.message}`)
    showErrorPanel(error.message)
  }
}

const onSudokuClick = () =>
  UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)

UI.setVideoClickHandler(onVideoClick)
UI.setSudokuClickHandler(onSudokuClick)

window.log = log

const main = async () => {
  log.info('[main] waiting for hello module to load')
  await helloModuleLoaded
  log.info('[main] hello module loaded')
  await loadModels()
  UI.hideSplashContent()
  UI.showMainContent()
  UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)
  log.info(`[main] tf memory: ${JSON.stringify(tf.memory())}`)
}

main()
