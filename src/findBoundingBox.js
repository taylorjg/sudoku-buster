import * as tf from '@tensorflow/tfjs'
import * as R from 'ramda'
import * as CALC from './calculations'
import * as SVG from './drawSvg'

export const findBoundingBox = async (gridImageTensor, svgElement) => {
  const itemsToDelete = []
  try {
    const tfCanvas = document.createElement('canvas')
    await tf.browser.toPixels(gridImageTensor, tfCanvas)
    const matInitial = cv.imread(tfCanvas)
    itemsToDelete.push(matInitial)

    const matGrey = new cv.Mat(matInitial.size(), cv.CV_8UC1)
    itemsToDelete.push(matGrey)
    cv.cvtColor(matInitial, matGrey, cv.COLOR_BGR2GRAY)

    const matBlur = new cv.Mat(matInitial.size(), cv.CV_8UC1)
    itemsToDelete.push(matBlur)
    const ksize = new cv.Size(5, 5)
    const sigmaX = 0
    cv.GaussianBlur(matGrey, matBlur, ksize, sigmaX)

    const matBinary = new cv.Mat(matInitial.size(), cv.CV_8UC1)
    itemsToDelete.push(matBinary)
    cv.adaptiveThreshold(matBlur, matBinary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 19, 3)

    const contours = new cv.MatVector()
    itemsToDelete.push(contours)
    const hierarchy = new cv.Mat()
    itemsToDelete.push(hierarchy)
    const mode = cv.RETR_EXTERNAL
    const method = cv.CHAIN_APPROX_SIMPLE
    cv.findContours(matBinary, contours, hierarchy, mode, method)
    const numContours = contours.size()
    if (numContours === 0) return undefined
    const areasAndBoundingRects = R.range(0, numContours).map(index => {
      const contour = contours.get(index)
      const area = cv.contourArea(contour)
      const boundingRect = cv.boundingRect(contour)
      return { area, boundingRect, contour }
    })
    const sorted = R.sort(R.descend(R.prop('area')), areasAndBoundingRects)
    console.dir(R.head(sorted))
    const { x, y, width, height } = R.head(sorted).boundingRect

    // I'm insetting by 2 pixels in both directions because
    // the best contour tends to be just slightly too big.
    const boundingBox = CALC.inset(x, y, width, height, 2, 2)

    SVG.drawboundingBox(svgElement, boundingBox, 'blue')

    return boundingBox
  } finally {
    itemsToDelete.forEach(item => item.delete())
  }
}
