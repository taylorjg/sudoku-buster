import * as tf from '@tensorflow/tfjs'
import * as R from 'ramda'
import log from 'loglevel'
import * as C from './constants'
import * as D from './data'
import * as I from './image'
import * as P from './puzzle'
import { findBoundingBox } from './findBoundingBox'
import { showErrorPanel } from './errorPanel'

const BLANK_PREDICTION_ACCURACY = 0.25
const BLANK_PREDICTION_LOWER_LIMIT = 1 - BLANK_PREDICTION_ACCURACY
const DIGIT_PREDICTION_UPPER_LIMIT = 0 + BLANK_PREDICTION_ACCURACY

const isBlankPredictionRubbish = p =>
  p > DIGIT_PREDICTION_UPPER_LIMIT && p < BLANK_PREDICTION_LOWER_LIMIT

const isBlank = p => p >= BLANK_PREDICTION_LOWER_LIMIT

// TODO
const findDigits = (blanksModel, gridImageTensor, boundingBox) => {
  // return indexedDigitImageTensorsArray
}

// TODO
const recogniseDigits = (digitsModel, indexedDigitImageTensorsArray) => {
  // return indexedDigitPredictions
}

export const scanSudokuFromImage = async (blanksModel, digitsModel, imageData) => {
  const disposables = []
  try {
    const gridImageTensor = I.normaliseGridImage(imageData)
    disposables.push(gridImageTensor)
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
    disposables.push(gridSquareImageTensors)
    const blanksPredictions = blanksModel.predict(gridSquareImageTensors)
    disposables.push(blanksPredictions)
    const blanksPredictionsArray = blanksPredictions.arraySync()
    if (blanksPredictionsArray.some(isBlankPredictionRubbish)) {
      throw new Error('Poor prediction of blanks vs digits.')
    }
    const gridSquareImageTensorsArray = tf.unstack(gridSquareImageTensors)
    disposables.push(...gridSquareImageTensorsArray)
    const indexedDigitImageTensorsArray = gridSquareImageTensorsArray
      .map((digitImageTensor, index) => ({ digitImageTensor, index }))
      .filter(({ index }) => !isBlank(blanksPredictionsArray[index]))
    log.info(`[scanSudokuFromImage] indexedDigitImageTensorsArray.length: ${indexedDigitImageTensorsArray.length}`)

    const digitImageTensorsArray = R.pluck('digitImageTensor', indexedDigitImageTensorsArray)
    const inputs = tf.stack(digitImageTensorsArray)
    disposables.push(inputs)
    const outputs = digitsModel.predict(inputs)
    disposables.push(outputs)
    const digitPredictions = tf.tidy(() => outputs.argMax(1).arraySync().map(R.inc))
    const indexedDigitPredictions = digitPredictions.map((digitPrediction, index) => ({
      digitPrediction,
      index: indexedDigitImageTensorsArray[index].index
    }))

    return P.indexedDigitPredictionsToInitialValues(indexedDigitPredictions)
  } catch (error) {
    log.error(`[scanSudokuFromImage] ${error.message}`)
    showErrorPanel(error.message)
    return undefined
  } finally {
    disposables.forEach(disposable => disposable.dispose())
  }
}
