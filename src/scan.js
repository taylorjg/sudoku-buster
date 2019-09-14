import log from 'loglevel'
import * as C from './constants'
import * as D from './data'
import * as I from './image'
import { findBoundingBox } from './findBoundingBox'

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

export const scanPuzzle = async (cellsModel, imageData) => {
  const disposables = []
  try {
    const gridImageTensor = I.normaliseGridImage(imageData)
    disposables.push(gridImageTensor)
    const boundingBox = await findAndCheckBoundingBox(gridImageTensor)
    return predictDigits(disposables, cellsModel, gridImageTensor, boundingBox)
  } finally {
    disposables.forEach(disposable => disposable.dispose())
  }
}
