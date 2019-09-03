import * as tf from '@tensorflow/tfjs'
import * as R from 'ramda'
import log from 'loglevel'
import * as C from './constants'
import * as D from './data'
import * as I from './image'
import * as P from './puzzle'
import { findBoundingBox } from './findBoundingBox'

const BLANK_PREDICTION_ACCURACY = 0.25
const BLANK_PREDICTION_LOWER_LIMIT = 1 - BLANK_PREDICTION_ACCURACY
const DIGIT_PREDICTION_UPPER_LIMIT = 0 + BLANK_PREDICTION_ACCURACY

const isPoorBlankPrediction = p =>
  p > DIGIT_PREDICTION_UPPER_LIMIT && p < BLANK_PREDICTION_LOWER_LIMIT

const isBlank = p => p >= BLANK_PREDICTION_LOWER_LIMIT

const findAndCheckBoundingBox = async gridImageTensor => {
  const boundingBox = await findBoundingBox(gridImageTensor)
  log.info(`[findAndCheckBoundingBox] boundingBox: ${JSON.stringify(boundingBox)}`)
  if (!boundingBox) {
    throw new Error('Failed to find bounding box.')
  }
  const [, , w, h] = boundingBox
  if (w < C.GRID_IMAGE_WIDTH / 2 || h < C.GRID_IMAGE_HEIGHT / 2) {
    throw new Error(`Bounding box is too small, ${JSON.stringify(boundingBox)}.`)
  }
  return boundingBox
}

const findDigits = async (disposables, blanksModel, gridImageTensor, boundingBox) => {
  const gridSquareImageTensors = D.cropGridSquaresFromUnknownGrid(
    gridImageTensor,
    boundingBox)
  disposables.push(gridSquareImageTensors)
  const blanksPredictions = blanksModel.predict(gridSquareImageTensors)
  disposables.push(blanksPredictions)
  const blanksPredictionsArray = await blanksPredictions.array()
  if (blanksPredictionsArray.some(isPoorBlankPrediction)) {
    throw new Error('Poor prediction of blanks vs digits.')
  }
  const gridSquareImageTensorsArray = tf.unstack(gridSquareImageTensors)
  disposables.push(...gridSquareImageTensorsArray)
  const indexedDigitImageTensorsArray = gridSquareImageTensorsArray
    .map((digitImageTensor, index) => ({ digitImageTensor, index }))
    .filter(({ index }) => !isBlank(blanksPredictionsArray[index]))
  log.info(`[findDigits] indexedDigitImageTensorsArray.length: ${indexedDigitImageTensorsArray.length}`)
  return indexedDigitImageTensorsArray
}

const recogniseDigits = async (disposables, digitsModel, digits) => {
  const digitImageTensorsArray = R.pluck('digitImageTensor', digits)
  const inputs = tf.stack(digitImageTensorsArray)
  disposables.push(inputs)
  const outputs = digitsModel.predict(inputs)
  disposables.push(outputs)
  const outputsArgMax = outputs.argMax(1)
  disposables.push(outputsArgMax)
  const outputsArgMaxArray = await outputsArgMax.array()
  const digitPredictions = outputsArgMaxArray.map(R.inc)
  const indexedDigitPredictions = digitPredictions.map((digitPrediction, index) => ({
    digitPrediction,
    index: digits[index].index
  }))
  return indexedDigitPredictions
}

export const scanPuzzle = async (blanksModel, digitsModel, imageData) => {
  const disposables = []
  try {
    const gridImageTensor = I.normaliseGridImage(imageData)
    disposables.push(gridImageTensor)
    const boundingBox = await findAndCheckBoundingBox(gridImageTensor)
    const digits = await findDigits(disposables, blanksModel, gridImageTensor, boundingBox)
    const digitPredictions = await recogniseDigits(disposables, digitsModel, digits)
    const puzzle = P.digitPredictionsToInitialValues(digitPredictions)
    return puzzle
  } finally {
    disposables.forEach(disposable => disposable.dispose())
  }
}
