import * as R from 'ramda'
import * as C from './constants'
import * as CALC from './calculations'

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
  return matResized
}

const distanceSquared = (pt1, pt2) =>
  Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2)

const distance = (pt1, pt2) =>
  Math.sqrt(distanceSquared(pt1, pt2))

const TOP_LEFT = 0
const TOP_RIGHT = 1
const BOTTOM_RIGHT = 2
const BOTTOM_LEFT = 3

const findCorners = contour => {
  const M = cv.moments(contour, true)
  const cx = M.m10 / M.m00
  const cy = M.m01 / M.m00
  const centre = { x: cx, y: cy }
  const corners = R.repeat(centre, 4)
  const maxDist = R.repeat(0, 4)
  const quadrant = p => {
    if (p.x < cx && p.y < cy) return TOP_LEFT
    if (p.x > cx && p.y < cy) return TOP_RIGHT
    if (p.x > cx && p.y > cy) return BOTTOM_RIGHT
    if (p.x < cx && p.y > cy) return BOTTOM_LEFT
    return -1
  }
  const points = R.splitEvery(2, contour.data32S).map(([x, y]) => ({ x, y }))
  for (const point of points) {
    const q = quadrant(point)
    if (q < 0) continue
    const d = distanceSquared(point, centre)
    if (d > maxDist[q]) {
      maxDist[q] = d
      corners[q] = point
    }
  }
  return corners
}

const matFromPoints = points => {
  const rows = points.length
  const cols = 1
  const type = cv.CV_32FC2
  const array = R.chain(({ x, y }) => [x, y], points)
  return cv.matFromArray(rows, cols, type, array)
}

const applyWarpPerspective = (itemsToDelete, matIn, corners) => {
  const widthTop = distance(corners[TOP_LEFT], corners[TOP_RIGHT])
  const widthBottom = distance(corners[BOTTOM_LEFT], corners[BOTTOM_RIGHT])
  const heightLeft = distance(corners[TOP_LEFT], corners[BOTTOM_LEFT])
  const heightRight = distance(corners[TOP_RIGHT], corners[BOTTOM_RIGHT])
  const dsize = new cv.Size(Math.max(widthTop, widthBottom), Math.max(heightLeft, heightRight))
  const flatCorners = [
    { x: 0, y: 0 },
    { x: dsize.width, y: 0 },
    { x: dsize.width, y: dsize.height },
    { x: 0, y: dsize.height }
  ]
  const matCorners = matFromPoints(corners)
  const matFlatCorners = matFromPoints(flatCorners)
  itemsToDelete.push(matCorners)
  itemsToDelete.push(matFlatCorners)
  const M = cv.getPerspectiveTransform(matCorners, matFlatCorners)
  itemsToDelete.push(M)
  const matOut = new cv.Mat()
  itemsToDelete.push(matOut)
  cv.warpPerspective(matIn, matOut, M, dsize)
  return matOut
}

export const findBoundingBox = async imageData => {
  const itemsToDelete = []
  try {
    const matNormalised = normaliseImageData(itemsToDelete, imageData)

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
    const { contour, boundingRect } = R.head(sorted)
    const { x, y, width, height } = boundingRect

    // I'm insetting by 2 pixels in both directions because
    // the best contour tends to be just slightly too big.
    const boundingBox = CALC.inset(x, y, width, height, 2, 2)

    const corners = findCorners(contour)

    const matCorrected = applyWarpPerspective(itemsToDelete, matNormalised, corners)
    const imageDataCorrected = matToImageData(itemsToDelete, matCorrected)

    return {
      contour,
      corners,
      boundingBox,
      imageDataCorrected
    }
  } finally {
    itemsToDelete.forEach(item => item.delete())
  }
}
