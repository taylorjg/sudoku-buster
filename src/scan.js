import log from 'loglevel'
import * as C from './constants'
import * as D from './data'
import * as I from './image'
import { findBoundingBox } from './findBoundingBox'

const findAndCheckBoundingBox = async (imageData, svgElement, options) => {
  const result = await findBoundingBox(imageData, svgElement, options)
  if (!result) {
    const error = new Error('Failed to find bounding box.')
    error.isScanException = true
    throw error
  }
  const { boundingBox } = result
  log.info(`[findAndCheckBoundingBox] boundingBox: ${JSON.stringify(boundingBox)}`)
  const [, , w, h] = boundingBox
  if (w < C.GRID_IMAGE_WIDTH / 2 || h < C.GRID_IMAGE_HEIGHT / 2) {
    const error = new Error(`Bounding box is too small, ${JSON.stringify(boundingBox)}.`)
    error.isScanException = true
    throw error
  }
  return result
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

export const scanPuzzle = async (cellsModel, imageTensor, svgElement, options) => {
  const disposables = []
  try {
    const imageData = await I.imageTensorToImageData(imageTensor)
    performance.mark('after imageTensorToImageData')
    const { boundingBox, imageDataNormalised } = await findAndCheckBoundingBox(imageData, svgElement, options)
    performance.mark('after findAndCheckBoundingBox')
    const imageTensorNormalised = I.imageDataToImageTensor(imageDataNormalised)
    disposables.push(imageTensorNormalised)
    performance.mark('after imageDataToImageTensor')
    const indexedDigitPredictions = await predictDigits(disposables, cellsModel, imageTensorNormalised, boundingBox)
    performance.mark('after predictDigits')
    return indexedDigitPredictions
  } finally {
    disposables.forEach(disposable => disposable.dispose())
  }
}
