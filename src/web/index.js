import * as tf from '@tensorflow/tfjs'
import * as R from 'ramda'
import * as log from 'loglevel'
import * as D from './data'
import * as I from './image'
import * as P from './puzzle'
import { findBoundingBox } from './findBoundingBox'
import { solve, getInitialValues } from './solve'
import { drawInitialGrid, drawSolution } from './drawSvg'

const hideSplashContent = () => {
  const splashContentElement = document.querySelector('.splash-content')
  splashContentElement.style.display = 'none'
}

const showMainContent = () => {
  const mainContentElement = document.querySelector('.main-content')
  mainContentElement.style.display = 'block'
}

const videoElement = document.getElementById('video')
const canvasElement = document.getElementById('canvas')
const sudokuElement = document.getElementById('sudoku')

let webcam = undefined
let blanksModel = undefined
let digitsModel = undefined

const DISPLAY_MODE_VIDEO = Symbol('DISPLAY_MODE_VIDEO')
const DISPLAY_MODE_CANVAS = Symbol('DISPLAY_MODE_CANVAS')
const DISPLAY_MODE_SUDOKU = Symbol('DISPLAY_MODE_SUDOKU')

const setDisplayMode = displayMode => {
  videoElement.style.display = displayMode === DISPLAY_MODE_VIDEO ? 'block' : 'none'
  canvasElement.style.display = displayMode === DISPLAY_MODE_CANVAS ? 'block' : 'none'
  sudokuElement.style.display = displayMode === DISPLAY_MODE_SUDOKU ? 'block' : 'none'
}

const drawSolvedSudoku = puzzle => {
  setDisplayMode(DISPLAY_MODE_SUDOKU)
  const initialValues = getInitialValues(puzzle)
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

const scanSudokuFromImage = async canvas => {
  try {
    const boundingBox = findBoundingBox(canvas)
    if (!boundingBox) {
      throw new Error('Failed to find bounding box.')
    }
    const [, , bbw, bbh] = boundingBox
    if (bbw < canvas.width / 2 || bbh < canvas.height / 2) {
      throw new Error('Bounding box is too small.')
    }
    const ctx = canvasElement.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const gridImageTensor = I.normaliseGridImage(imageData)
    const gridSquareImageTensors = D.cropGridSquaresFromUnknownGrid(
      gridImageTensor,
      boundingBox)
    const blanksPredictionsArray = blanksModel.predict(gridSquareImageTensors).arraySync()
    if (blanksPredictionsArray.some(isBlankPredictionRubbish)) {
      throw new Error('Prediction of blanks vs digits too inaccurate to proceed.')
    }
    const gridSquareImageTensorsArray = tf.unstack(gridSquareImageTensors)
    const indexedDigitImageTensorsArray = gridSquareImageTensorsArray
      .map((digitImageTensor, index) => ({ digitImageTensor, index }))
      .filter(({ index }) => !isBlank(blanksPredictionsArray[index]))
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
    log.error(`[onPredictCapture] ${error.message}`)
  }
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
}

const captureWebcam = async () => {
  const imageTensor = await webcam.capture()
  webcam.stop()
  webcam = undefined // eslint-disable-line
  setDisplayMode(DISPLAY_MODE_CANVAS)
  await tf.browser.toPixels(imageTensor, canvasElement)
  const puzzle = await scanSudokuFromImage(canvasElement)
  drawSolvedSudoku(puzzle)
}

const onClickVideo = async () =>
  webcam === undefined ? startWebcam() : captureWebcam()

const onClickSudoku = () =>
  setDisplayMode(DISPLAY_MODE_VIDEO)

videoElement.addEventListener('click', onClickVideo)
sudokuElement.addEventListener('click', onClickSudoku)

const onOpenCVLoaded = async () => {
  const models = await Promise.all([
    tf.loadLayersModel(`${location.origin}/models/blanks/model.json`),
    tf.loadLayersModel(`${location.origin}/models/digits/model.json`)
  ])
  blanksModel = models[0]
  digitsModel = models[1]
  hideSplashContent()
  showMainContent()
}

const loadOpenCV = () => {
  const headElement = document.querySelector('head')
  const scriptElement = document.createElement('script')
  scriptElement.setAttribute('src', '/opencv_4.1.1.js')
  scriptElement.onload = onOpenCVLoaded
  headElement.appendChild(scriptElement)
}

const main = () => {
  loadOpenCV()
}

main()
