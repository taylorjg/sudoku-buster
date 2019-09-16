import log from 'loglevel'
import * as C from './constants'
import * as D from './data'
import * as I from './image'
import { findBoundingBox } from './findBoundingBox'

const findAndCheckBoundingBox = async (gridImageTensor, svgElement, options) => {
  const boundingBox = await findBoundingBox(gridImageTensor, svgElement, options)
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
  const batchSize = 9 // 81
  const outputs = cellsModel.predict(gridSquareImageTensors, { batchSize })
  disposables.push(outputs)
  const outputsArgMax = outputs.argMax(1)
  disposables.push(outputsArgMax)
  const outputsArgMaxArray = await outputsArgMax.array()
  const indexedDigitPredictions = outputsArgMaxArray
    .map((digitPrediction, index) => ({ digitPrediction, index }))
    .filter(({ digitPrediction }) => digitPrediction > 0)
  return indexedDigitPredictions
}

export const scanPuzzle = async (cellsModel, imageData, svgElement, options) => {
  const disposables = []
  try {
    const gridImageTensor = I.normaliseGridImage(imageData)
    disposables.push(gridImageTensor)
    performance.mark('after normaliseGridImage')
    const boundingBox = await findAndCheckBoundingBox(gridImageTensor, svgElement, options)
    performance.mark('after findAndCheckBoundingBox')
    const indexedDigitPredictions = await predictDigits(disposables, cellsModel, gridImageTensor, boundingBox)
    performance.mark('after predictDigits')
    return indexedDigitPredictions
  } finally {
    disposables.forEach(disposable => disposable.dispose())
  }
}
