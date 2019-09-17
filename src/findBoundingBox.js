import * as R from 'ramda'
import * as C from './constants'
import * as CALC from './calculations'
import * as SVG from './drawSvg'

// Assumes that 'mat' is cv.CV_8UC1.
const matToImageData = (itemsToDelete, mat) => {
  const matTmp = new cv.Mat()
  itemsToDelete.push(matTmp)
  // cv.CV_8UC1 => cv.CV_8UC4
  cv.cvtColor(mat, matTmp, cv.COLOR_GRAY2RGBA)
  const array = new Uint8ClampedArray(matTmp.data)
  const imageData = new ImageData(array, mat.cols, mat.rows)
  return imageData
}

const normaliseImageData = (itemsToDelete, imageDataIn) => {
  const matInitial = cv.matFromImageData(imageDataIn)
  itemsToDelete.push(matInitial)
  const matGrey = new cv.Mat()
  itemsToDelete.push(matGrey)
  // cv.CV_8UC4 => cv.CV_8UC1
  cv.cvtColor(matInitial, matGrey, cv.COLOR_RGBA2GRAY)
  const matResized = new cv.Mat()
  itemsToDelete.push(matResized)
  const dsize = new cv.Size(C.GRID_IMAGE_WIDTH, C.GRID_IMAGE_HEIGHT)
  cv.resize(matGrey, matResized, dsize)
  const imageDataOut = matToImageData(itemsToDelete, matResized)
  return {
    matNormalised: matResized,
    imageDataNormalised: imageDataOut
  }
}

export const findBoundingBox = async (imageData, svgElement, options = {}) => {
  const itemsToDelete = []
  try {
    const { matNormalised, imageDataNormalised } = normaliseImageData(itemsToDelete, imageData)

    const matBlur = new cv.Mat()
    itemsToDelete.push(matBlur)
    const ksize = new cv.Size(5, 5)
    const sigmaX = 0
    cv.GaussianBlur(matNormalised, matBlur, ksize, sigmaX)

    const matBinary = new cv.Mat()
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
    const { x, y, width, height } = R.head(sorted).boundingRect

    // I'm insetting by 2 pixels in both directions because
    // the best contour tends to be just slightly too big.
    const boundingBox = CALC.inset(x, y, width, height, 2, 2)

    if (options.drawBoundingBox) {
      SVG.drawBoundingBox(svgElement, boundingBox, 'blue')
    }

    if (options.drawContour) {
      const contour = R.head(sorted).contour
      const points = R.splitEvery(2, contour.data32S).map(([x, y]) => ({ x, y }))
      SVG.drawContour(svgElement, points, 'red')
    }

    return {
      boundingBox,
      imageDataNormalised
    }
  } finally {
    itemsToDelete.forEach(item => item.delete())
  }
}
