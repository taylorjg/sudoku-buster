import * as tf from '@tensorflow/tfjs'
import * as R from 'ramda'
import log from 'loglevel'
import * as C from './constants'
import * as I from './image'
import * as UI from './ui'
import { scanSudokuFromImage } from './scan'
import { getInitialValues, solve } from './solve'
import { drawInitialValues, drawSolution } from './drawSvg'
import { hideErrorPanel } from './errorPanel'

let webcam = undefined
let blanksModel = undefined
let digitsModel = undefined

const drawPuzzle = puzzle => {
  UI.setDisplayMode(UI.DISPLAY_MODE_SUDOKU)
  const initialValues = getInitialValues(puzzle)
  drawInitialValues(UI.sudokuElement, initialValues)
  const solutions = solve(puzzle)
  if (solutions.length === 1) {
    drawSolution(UI.sudokuElement, solutions[0])
  }
}

const processImage = async gridImageTensor => {
  log.info(`[processImage] gridImageTensor.shape: ${gridImageTensor.shape}`)
  UI.setDisplayMode(UI.DISPLAY_MODE_CANVAS)
  const imageData = await I.imageTensorToImageData(gridImageTensor)
  const puzzle = await scanSudokuFromImage(blanksModel, digitsModel, imageData)
  if (!puzzle) {
    UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)
    return
  }
  log.info('[processImage] puzzle:')
  puzzle.forEach((row, index) => log.info(`row[${index}]: ${row}`))
  drawPuzzle(puzzle)
}

const startWebcam = async () => {
  hideErrorPanel()
  const videoRect = UI.videoElement.getBoundingClientRect()
  log.info(`[startWebcam] videoRect: ${JSON.stringify(videoRect)}`)
  const width = Math.round(videoRect.width)
  const height = Math.round(videoRect.height)
  log.info(`[startWebcam] width: ${width}; height: ${height}`)
  const webcamConfig = { facingMode: 'environment' }
  UI.videoElement.width = width
  UI.videoElement.height = height
  webcam = await tf.data.webcam(UI.videoElement, webcamConfig) //eslint-disable-line
  UI.setDisplayMode(UI.DISPLAY_MODE_VIDEO)
}

const captureWebcam = async () => {
  const gridImageTensor = await webcam.capture()
  webcam.stop()
  webcam = undefined // eslint-disable-line
  await processImage(gridImageTensor)
  gridImageTensor.dispose()
  log.info(`[captureWebcam] tf memory: ${JSON.stringify(tf.memory())}`)
}

const onClickVideo = async () =>
  webcam === undefined ? startWebcam() : captureWebcam()

const onClickSudoku = () =>
  UI.setDisplayMode(UI.DISPLAY_MODE_INSTRUCTIONS)

UI.videoElement.addEventListener('click', onClickVideo)
UI.sudokuElement.addEventListener('click', onClickSudoku)

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
