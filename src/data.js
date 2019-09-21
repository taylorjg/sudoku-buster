import * as tf from '@tensorflow/tfjs'
import * as R from 'ramda'
import * as C from './constants'
import * as CALC from './calculations'

const normaliseForCropping = (imageWidth, imageHeight) => ([x, y, w, h]) => {
  const normaliseX = value => value / (imageWidth - 1)
  const normaliseY = value => value / (imageHeight - 1)
  return [
    normaliseY(y),
    normaliseX(x),
    normaliseY(y + h),
    normaliseX(x + w)
  ]
}

export const cropGridSquares = (gridImageTensor, boundingBox) =>
  tf.tidy(() => {
    // HWC shape
    const [imageHeight, imageWidth] = gridImageTensor.shape
    const gridSquares = CALC.calculateGridSquares(boundingBox)
    const image = gridImageTensor.div(255).expandDims()
    const boxes = gridSquares.map(normaliseForCropping(imageWidth, imageHeight))
    const boxInd = R.repeat(0, boxes.length)
    const cropSize = [C.DIGIT_IMAGE_HEIGHT, C.DIGIT_IMAGE_WIDTH]
    return tf.image.cropAndResize(image, boxes, boxInd, cropSize)
  })
