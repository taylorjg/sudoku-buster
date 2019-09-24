import * as R from 'ramda'
import * as C from './constants'

const GRID_LINE_THIN_WIDTH = 1
const GRID_LINE_THICK_WIDTH = GRID_LINE_THIN_WIDTH * 4
const TX = GRID_LINE_THICK_WIDTH / 2
const TY = GRID_LINE_THICK_WIDTH / 2

const deleteChildren = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

const createSvgElement = (elementName, additionalAttributes = {}) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', elementName)
  Object.entries(additionalAttributes).forEach(([name, value]) =>
    element.setAttribute(name, value))
  return element
}

const drawHorizontalGridLines = svgElement => {
  const width = svgElement.getBoundingClientRect().width
  const squareSize = (width - 2 * TX) / 9
  const ys = R.range(0, 10)
  ys.forEach(y => {
    const gridLine = createSvgElement('line', {
      x1: 0,
      y1: TY + y * squareSize,
      x2: width,
      y2: TY + y * squareSize,
      'class': 'sudoku__grid-line',
      'stroke-width': y % 3 == 0 ? GRID_LINE_THICK_WIDTH : GRID_LINE_THIN_WIDTH
    })
    svgElement.appendChild(gridLine)
  })
}

const drawVerticalGridLines = svgElement => {
  const height = svgElement.getBoundingClientRect().height
  const squareSize = (height - 2 * TY) / 9
  const xs = R.range(0, 10)
  xs.forEach(x => {
    const gridLine = createSvgElement('line', {
      x1: TX + x * squareSize,
      y1: 0,
      x2: TX + x * squareSize,
      y2: height,
      'class': 'sudoku__grid-line',
      'stroke-width': x % 3 == 0 ? GRID_LINE_THICK_WIDTH : GRID_LINE_THIN_WIDTH
    })
    svgElement.appendChild(gridLine)
  })
}

const drawValue = (svgElement, row) => {
  const width = svgElement.getBoundingClientRect().width
  const height = svgElement.getBoundingClientRect().height
  const squareWidth = (width - GRID_LINE_THICK_WIDTH) / 9
  const squareHeight = (height - GRID_LINE_THICK_WIDTH) / 9
  const textElement = createSvgElement('text', {
    x: TX + (row.coords.col + 0.5) * squareWidth,
    y: TY + (row.coords.row + 0.5) * squareHeight,
    'class': row.isInitialValue
      ? 'sudoku__digit sudoku__digit--initial'
      : 'sudoku__digit sudoku__digit--calculated',
    'data-coords': `${row.coords.col}-${row.coords.row}`,
    'data-is-initial-value': row.isInitialValue
  })
  const textNode = document.createTextNode(row.value)
  textElement.appendChild(textNode)
  svgElement.appendChild(textElement)
}

export const drawInitialValues = (svgElement, rows) => {
  deleteChildren(svgElement)
  drawHorizontalGridLines(svgElement)
  drawVerticalGridLines(svgElement)
  const initialValues = rows.filter(row => row.isInitialValue)
  initialValues.forEach(row => drawValue(svgElement, row))
}

export const drawSolution = (svgElement, rows) => {
  const calculatedValues = rows.filter(row => !row.isInitialValue)
  calculatedValues.forEach(row => drawValue(svgElement, row))
}

const clearDiagnostic = (svgElement, selector) => {
  const existingElement = svgElement.querySelector(selector)
  if (existingElement) {
    existingElement.parentNode.removeChild(existingElement)
  }
}

export const clearDiagnostics = svgElement => {
  clearDiagnostic(svgElement, '.contour')
  clearDiagnostic(svgElement, '.corners')
  clearDiagnostic(svgElement, '.bounding-box')
  clearDiagnostic(svgElement, '.grid-squares')
}

export const drawContour = (svgElement, points, colour) => {
  const scaleX = 100 / C.GRID_IMAGE_WIDTH
  const scaleY = 100 / C.GRID_IMAGE_HEIGHT
  const polygon = createSvgElement('polygon', {
    'class': 'contour',
    stroke: colour,
    'stroke-width': 1 * scaleX,
    points: points.map(({ x, y }) => `${x * scaleX},${y * scaleY}`).join(' '),
    fill: 'none'
  })
  svgElement.appendChild(polygon)
}

export const drawCorners = (svgElement, points, colour) => {
  const scaleX = 100 / C.GRID_IMAGE_WIDTH
  const scaleY = 100 / C.GRID_IMAGE_HEIGHT
  const polygon = createSvgElement('polygon', {
    'class': 'corners',
    stroke: colour,
    'stroke-width': 1 * scaleX,
    points: points.map(({ x, y }) => `${x * scaleX},${y * scaleY}`).join(' '),
    fill: 'none'
  })
  svgElement.appendChild(polygon)
}

export const drawBoundingBox = (svgElement, boundingBox, colour) => {
  const [x, y, width, height] = boundingBox
  const scaleX = 100 / C.GRID_IMAGE_WIDTH
  const scaleY = 100 / C.GRID_IMAGE_HEIGHT
  const rect = createSvgElement('rect', {
    'class': 'bounding-box',
    stroke: colour,
    'stroke-width': 1 * scaleX,
    fill: 'none',
    x: x * scaleX,
    y: y * scaleY,
    width: width * scaleX,
    height: height * scaleY
  })
  svgElement.appendChild(rect)
}

export const drawGridSquares = (svgElement, gridSquares, colour) => {
  const scaleX = 100 / C.GRID_IMAGE_WIDTH
  const scaleY = 100 / C.GRID_IMAGE_HEIGHT
  const d = gridSquares
    .map(([x, y, w, h]) => {
      const sx = x * scaleX
      const sy = y * scaleY
      const sw = w * scaleX
      const sh = h * scaleY
      return `M${sx},${sy} h${sw} v${sh} h${-sw} z`
    })
    .join(' ')
  const path = createSvgElement('path', {
    'class': 'grid-squares',
    stroke: colour,
    'stroke-width': 1 * scaleX,
    fill: 'none',
    d
  })
  svgElement.appendChild(path)
}
