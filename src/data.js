import * as tf from '@tensorflow/tfjs'
import * as R from 'ramda'
import * as C from './constants'
import * as CALC from './calculations'

const normaliseForGridCropping = ([x, y, w, h]) => {
  const normaliseX = value => value / (C.GRID_IMAGE_WIDTH - 1)
  const normaliseY = value => value / (C.GRID_IMAGE_HEIGHT - 1)
  return [
    normaliseY(y),
    normaliseX(x),
    normaliseY(y + h),
    normaliseX(x + w)
  ]
}

export const cropGridSquaresFromUnknownGrid = (gridImageTensor, boundingBox) =>
  tf.tidy(() => {
    const gridSquares = CALC.calculateGridSquares(boundingBox)
    const image = tf.stack(R.of(gridImageTensor.div(255)))
    const boxes = gridSquares.map(normaliseForGridCropping)
    const boxInd = R.repeat(0, boxes.length)
    const cropSize = [C.DIGIT_IMAGE_HEIGHT, C.DIGIT_IMAGE_WIDTH]
    return tf.image.cropAndResize(image, boxes, boxInd, cropSize)
  })
