import * as R from 'ramda'
import * as CALC from './calculations'

export const findBoundingBox = async imageDataGreyscale => {
  const thingsToDelete = []
  try {
    const matInitial = cv.matFromImageData(imageDataGreyscale)
    thingsToDelete.push(matInitial)

    const rgbaPlanes = new cv.MatVector()
    thingsToDelete.push(rgbaPlanes)
    cv.split(matInitial, rgbaPlanes)
    const matGrey = rgbaPlanes.get(0)
    thingsToDelete.push(matGrey)

    const matBlur = new cv.Mat(matInitial.size(), cv.CV_8UC1)
    thingsToDelete.push(matBlur)
    const ksize = new cv.Size(5, 5)
    const sigmaX = 0
    cv.GaussianBlur(matGrey, matBlur, ksize, sigmaX)

    const matBinary = new cv.Mat(matInitial.size(), cv.CV_8UC1)
    thingsToDelete.push(matBinary)
    cv.adaptiveThreshold(matBlur, matBinary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 19, 3)

    const contours = new cv.MatVector()
    const hierarchy = new cv.Mat()
    const mode = cv.RETR_EXTERNAL
    const method = cv.CHAIN_APPROX_SIMPLE
    cv.findContours(matBinary, contours, hierarchy, mode, method)
    const numContours = contours.size()
    if (numContours === 0) return undefined
    const areasAndBoundingRects = R.range(0, numContours).map(index => {
      const contour = contours.get(index)
      const area = cv.contourArea(contour)
      const boundingRect = cv.boundingRect(contour)
      return { area, boundingRect }
    })
    const sorted = R.sort(R.descend(R.prop('area')), areasAndBoundingRects)
    const { x, y, width, height } = R.head(sorted).boundingRect

    // I'm insetting by 2 pixels in both directions because
    // the best contour tends to be just slightly too big.
    const boundingBox = CALC.inset(x, y, width, height, 2, 2)

    return boundingBox
  } finally {
    thingsToDelete.forEach(item => item.delete())
  }
}
