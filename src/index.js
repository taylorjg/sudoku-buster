import * as tf from '@tensorflow/tfjs'
import * as R from 'ramda'
import * as log from 'loglevel'
import * as C from './constants'
import * as D from './data'
import * as I from './image'
import * as P from './puzzle'
import { findBoundingBox } from './findBoundingBox'
import { solve, getInitialValues } from './solve'
import { drawInitialGrid, drawSolution } from './drawSvg'
import { showErrorPanel, hideErrorPanel } from './errorPanel'

const hideSplashContent = () => {
  const splashContentElement = document.querySelector('.splash-content')
  splashContentElement.style.display = 'none'
}

const showMainContent = () => {
  const mainContentElement = document.querySelector('.main-content')
  mainContentElement.style.display = 'block'
}

let webcam = undefined
let blanksModel = undefined
let digitsModel = undefined

const DISPLAY_MODE_INSTRUCTIONS = Symbol('DISPLAY_MODE_INSTRUCTIONS')
const DISPLAY_MODE_VIDEO = Symbol('DISPLAY_MODE_VIDEO')
const DISPLAY_MODE_CANVAS = Symbol('DISPLAY_MODE_CANVAS')
const DISPLAY_MODE_SUDOKU = Symbol('DISPLAY_MODE_SUDOKU')

const videoElement = document.getElementById('video')
const videoOverlayGuidesElement = document.getElementById('video-overlay-guides')
const videoOverlayInstructionsElement = document.getElementById('video-overlay-instructions')
const canvasElement = document.getElementById('canvas')
const sudokuElement = document.getElementById('sudoku')

const setDisplayMode = displayMode => {
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

const drawSolvedPuzzle = puzzle => {
  setDisplayMode(DISPLAY_MODE_SUDOKU)
  const initialValues = getInitialValues(puzzle)
  console.dir(initialValues)
  drawInitialGrid(sudokuElement, initialValues)
  const solutions = solve(puzzle)
  if (solutions.length === 1) {
    drawSolution(sudokuElement, solutions[0])
  }
}

const BLANK_PREDICTION_ACCURACY = 0.25
const BLANK_PREDICTION_LOWER_LIMIT = 1 - BLANK_PREDICTION_ACCURACY
const DIGIT_PREDICTION_UPPER_LIMIT = 0 + BLANK_PREDICTION_ACCURACY

const isBlankPredictionRubbish = p =>
  p > DIGIT_PREDICTION_UPPER_LIMIT && p < BLANK_PREDICTION_LOWER_LIMIT

const isBlank = p => p >= BLANK_PREDICTION_LOWER_LIMIT

const scanSudokuFromImage = async imageData => {
  try {
    hideErrorPanel()
    const gridImageTensor = I.normaliseGridImage(imageData)
    log.info(`[scanSudokuFromImage] normalised gridImageTensor.shape: ${gridImageTensor.shape}`)
    const boundingBox = await findBoundingBox(gridImageTensor)
    log.info(`[scanSudokuFromImage] boundingBox: ${JSON.stringify(boundingBox)}`)
    if (!boundingBox) {
      throw new Error('Failed to find bounding box.')
    }
    const [, , bbw, bbh] = boundingBox
    if (bbw < C.GRID_IMAGE_WIDTH / 2 || bbh < C.GRID_IMAGE_HEIGHT / 2) {
      throw new Error(`Bounding box is too small, ${JSON.stringify(boundingBox)}.`)
    }
    const gridSquareImageTensors = D.cropGridSquaresFromUnknownGrid(
      gridImageTensor,
      boundingBox)
    const blanksPredictionsArray = blanksModel.predict(gridSquareImageTensors).arraySync()
    if (blanksPredictionsArray.some(isBlankPredictionRubbish)) {
      throw new Error('Poor prediction of blanks vs digits.')
    }
    const gridSquareImageTensorsArray = tf.unstack(gridSquareImageTensors)
    const indexedDigitImageTensorsArray = gridSquareImageTensorsArray
      .map((digitImageTensor, index) => ({ digitImageTensor, index }))
      .filter(({ index }) => !isBlank(blanksPredictionsArray[index]))
    log.info(`[scanSudokuFromImage] indexedDigitImageTensorsArray.length: ${indexedDigitImageTensorsArray.length}`)
    const digitImageTensorsArray = R.pluck('digitImageTensor', indexedDigitImageTensorsArray)
    const inputs = tf.stack(digitImageTensorsArray)
    const outputs = digitsModel.predict(inputs)
    const digitPredictions = outputs.argMax(1).arraySync().map(R.inc)
    const indexedDigitPredictions = digitPredictions.map((digitPrediction, index) => ({
      digitPrediction,
      index: indexedDigitImageTensorsArray[index].index
    }))
    return P.indexedDigitPredictionsToInitialValues(indexedDigitPredictions)
  } catch (error) {
    log.error(`[scanSudokuFromImage] ${error.message}`)
    showErrorPanel(error.message)
    return undefined
  }
}

const processImage = async gridImageTensor => {
  log.info(`[processImage] gridImageTensor.shape: ${gridImageTensor.shape}`)
  setDisplayMode(DISPLAY_MODE_CANVAS)
  await tf.browser.toPixels(gridImageTensor, canvasElement)
  const ctx = canvasElement.getContext('2d')
  const imageWidth = canvasElement.width
  const imageHeight = canvasElement.height
  log.info(`[processImage] imageWidth: ${imageWidth}; imageHeight: ${imageHeight}`)
  const imageData = ctx.getImageData(0, 0, imageWidth, imageHeight)
  const puzzle = await scanSudokuFromImage(imageData)
  if (!puzzle) {
    setDisplayMode(DISPLAY_MODE_INSTRUCTIONS)
    return
  }
  log.info('[processImage] puzzle:')
  puzzle.forEach((row, index) => log.info(`row[${index}]: ${row}`))
  drawSolvedPuzzle(puzzle)
}

const startWebcam = async () => {
  const videoRect = videoElement.getBoundingClientRect()
  const webcamConfig = {
    facingMode: 'environment',
    resizeWidth: videoRect.width,
    resizeHeight: videoRect.height
  }
  videoElement.width = videoRect.width
  videoElement.height = videoRect.height
  webcam = await tf.data.webcam(videoElement, webcamConfig) //eslint-disable-line
  setDisplayMode(DISPLAY_MODE_VIDEO)
}

const captureWebcam = async () => {
  const gridImageTensor = await webcam.capture()
  webcam.stop()
  webcam = undefined // eslint-disable-line
  processImage(gridImageTensor)
}

const onClickVideo = async () =>
  webcam === undefined ? startWebcam() : captureWebcam()

const onClickSudoku = () =>
  setDisplayMode(DISPLAY_MODE_INSTRUCTIONS)

videoElement.addEventListener('click', onClickVideo)
sudokuElement.addEventListener('click', onClickSudoku)

const primeModels = () => {
  const canvas = document.createElement('canvas')
  canvas.width = C.DIGIT_IMAGE_WIDTH
  canvas.height = C.DIGIT_IMAGE_HEIGHT
  const imageTensor = tf.browser.fromPixels(canvas, C.DIGIT_IMAGE_CHANNELS)
  const xs = tf.stack(R.of(imageTensor))
  blanksModel.predict(xs)
  digitsModel.predict(xs)
}

const onOpenCVLoaded = async () => {
  const models = await Promise.all([
    tf.loadLayersModel(`${location.origin}/models/blanks/model.json`),
    tf.loadLayersModel(`${location.origin}/models/digits/model.json`)
  ])
  blanksModel = models[0]
  digitsModel = models[1]
  primeModels()
  hideSplashContent()
  showMainContent()
  setDisplayMode(DISPLAY_MODE_INSTRUCTIONS)
}

const loadOpenCV = () => {
  const headElement = document.querySelector('head')
  const scriptElement = document.createElement('script')
  scriptElement.setAttribute('src', '/opencv_4.1.1.js')
  scriptElement.onload = onOpenCVLoaded
  headElement.appendChild(scriptElement)
}

const main = () => {
  log.setLevel('error')
  loadOpenCV()
}

// const imageTensor = tf.browser.fromPixels(canvas)
main()
