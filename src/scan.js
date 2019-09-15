import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'
import * as C from './constants'
import * as D from './data'
import * as I from './image'
import { findBoundingBox } from './findBoundingBox'

const findAndCheckBoundingBox = async imageDataGreyscale => {
  const boundingBox = await findBoundingBox(imageDataGreyscale)
  log.info(`[findAndCheckBoundingBox] boundingBox: ${JSON.stringify(boundingBox)}`)
  if (!boundingBox) {
    const error = new Error('Failed to find bounding box.')
    error.isScanException = true
    throw error
  }
  const [, , w, h] = boundingBox
  if (w < C.GRID_IMAGE_WIDTH / 2 || h < C.GRID_IMAGE_HEIGHT / 2) {
    const error = new Error(`Bounding box is too small, ${JSON.stringify(boundingBox)}.`)
    error.isScanException = true
    throw error
  }
  return boundingBox
}

const predictDigits = async (disposables, cellsModel, gridImageTensor, boundingBox) => {
  const gridSquareImageTensors = D.cropGridSquaresFromUnknownGrid(
    gridImageTensor,
    boundingBox)
  disposables.push(gridSquareImageTensors)
  const outputs = cellsModel.predict(gridSquareImageTensors)
  disposables.push(outputs)
  const outputsArgMax = outputs.argMax(1)
  disposables.push(outputsArgMax)
  const outputsArgMaxArray = await outputsArgMax.array()
  const indexedDigitPredictions = outputsArgMaxArray
    .map((digitPrediction, index) => ({ digitPrediction, index }))
    .filter(({ digitPrediction }) => digitPrediction > 0)
  return indexedDigitPredictions
}

export const scanPuzzle = async (cellsModel, gridImageTensor) => {
  const disposables = []
  try {
    const imageData = await I.imageTensorToImageData(gridImageTensor)
    const imageDataGreyscale = I.convertToGreyscale(imageData)
    const gridImageTensorGreyscale = tf.browser.fromPixels(imageDataGreyscale, C.GRID_IMAGE_CHANNELS)
    disposables.push(gridImageTensorGreyscale)
    const boundingBox = await findAndCheckBoundingBox(imageDataGreyscale)
    return predictDigits(disposables, cellsModel, gridImageTensor, boundingBox)
  } finally {
    disposables.forEach(disposable => disposable.dispose())
  }
}
