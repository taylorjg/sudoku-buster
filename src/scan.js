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

const isBlankPredictionRubbish = p =>
  p > DIGIT_PREDICTION_UPPER_LIMIT && p < BLANK_PREDICTION_LOWER_LIMIT

const isBlank = p => p >= BLANK_PREDICTION_LOWER_LIMIT

// TODO
// const findDigits = (blanksModel, gridImageTensor, boundingBox) => {
//   // return indexedDigitImageTensorsArray
// }

// TODO
// const recogniseDigits = (digitsModel, indexedDigitImageTensorsArray) => {
//   // return indexedDigitPredictions
// }

export const scanPuzzle = async (blanksModel, digitsModel, imageData) => {
  const disposables = []
  try {
    const gridImageTensor = I.normaliseGridImage(imageData)
    disposables.push(gridImageTensor)
    log.info(`[scanPuzzle] normalised gridImageTensor.shape: ${gridImageTensor.shape}`)

    const boundingBox = await findBoundingBox(gridImageTensor)
    log.info(`[scanPuzzle] boundingBox: ${JSON.stringify(boundingBox)}`)
    if (!boundingBox) {
      throw new Error('Failed to find bounding box.')
    }
    const [, , bbw, bbh] = boundingBox
    if (bbw < C.GRID_IMAGE_WIDTH / 2 || bbh < C.GRID_IMAGE_HEIGHT / 2) {
      throw new Error(`Bounding box is too small, ${JSON.stringify(boundingBox)}.`)
    }

    // Extract to 'findDigits'
    const gridSquareImageTensors = D.cropGridSquaresFromUnknownGrid(
      gridImageTensor,
      boundingBox)
    disposables.push(gridSquareImageTensors)
    const blanksPredictions = blanksModel.predict(gridSquareImageTensors)
    disposables.push(blanksPredictions)
    const blanksPredictionsArray = await blanksPredictions.array()
    if (blanksPredictionsArray.some(isBlankPredictionRubbish)) {
      throw new Error('Poor prediction of blanks vs digits.')
    }
    const gridSquareImageTensorsArray = tf.unstack(gridSquareImageTensors)
    disposables.push(...gridSquareImageTensorsArray)
    const indexedDigitImageTensorsArray = gridSquareImageTensorsArray
      .map((digitImageTensor, index) => ({ digitImageTensor, index }))
      .filter(({ index }) => !isBlank(blanksPredictionsArray[index]))
    log.info(`[scanPuzzle] indexedDigitImageTensorsArray.length: ${indexedDigitImageTensorsArray.length}`)

    // Extract to 'recogniseDigits'
    const digitImageTensorsArray = R.pluck('digitImageTensor', indexedDigitImageTensorsArray)
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
      index: indexedDigitImageTensorsArray[index].index
    }))

    return P.indexedDigitPredictionsToInitialValues(indexedDigitPredictions)
  } finally {
    disposables.forEach(disposable => disposable.dispose())
  }
}
