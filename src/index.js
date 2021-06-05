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

let metricsPerFrame = []
let startTime = 0

const resetScanMetrics = () => {
  metricsPerFrame = []
  startTime = performance.now()
}

const saveScanMetrics = async (outcome, imageDataURL, solution) => {
  try {
    const duration = performance.now() - startTime
    const timestamp = new Date().getTime()
    const frameCount = metricsPerFrame.length
    const fps = frameCount / (duration / 1000)
    const version = packagejson.version
    const data = {
      version,
      timestamp,
      outcome,
      duration,
      frameCount,
      fps,
      metricsPerFrame: metricsPerFrame.slice(-100),
      imageDataURL,
      solution
    }
    await axios.post('/api/scanMetrics', data)
  } catch (error) {
    log.error(`[saveScanMetrics] ${error.message}`)
  }
}

const stashFrameMetrics = async () => {
  const frameMetrics = performance.getEntriesByType('measure')
  metricsPerFrame.push(frameMetrics)
}

const processImage = async (imageData, svgElement) => {
  try {
    const digitPredictions = await scanPuzzle(getCellsModel(), imageData, svgElement, scanPuzzleOptions)

    if (!satisfiesAllConstraints(digitPredictions)) return

    const puzzle = digitPredictionsToPuzzle(digitPredictions)
    const initialValues = getInitialValues(puzzle)

    performance.mark('solve-start')
    const solutions = solve(puzzle, { numSolutions: 1 })
    performance.measure('solve', 'solve-start')

    if (solutions.length !== 1) return

    const solution = solutions[0]
    UI.setDisplayMode(UI.DISPLAY_MODE_SOLUTION)

    performance.mark('drawPuzzle-start')
    UI.drawPuzzle(initialValues, solution)
    performance.measure('drawPuzzle', 'drawPuzzle-start')

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
      performance.clearMeasures()

      performance.mark('overall-start')

      performance.mark('captureWebcam-start')
      const imageData = await captureWebcam()
      performance.measure('captureWebcam', 'captureWebcam-start')

      if (!imageData) break
      result = await processImage(imageData, elements.videoOverlayGuidesElement)
      if (result) break
    } catch (error) {
      log.error(`[onVideoClick] ${error.message}`)
      showErrorPanel(error)
    } finally {
      disposables.forEach(disposable => disposable.dispose())
      stashFrameMetrics()
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
