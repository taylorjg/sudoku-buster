import * as R from 'ramda'

const GRID_LINE_THIN_WIDTH = 1
const GRID_LINE_THICK_WIDTH = GRID_LINE_THIN_WIDTH * 4
const TX = GRID_LINE_THICK_WIDTH / 2
const TY = GRID_LINE_THICK_WIDTH / 2

const createSvgElement = (elementName, additionalAttributes = {}) => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', elementName)
  Object.entries(additionalAttributes).forEach(([name, value]) =>
    element.setAttribute(name, value))
  return element
}

const drawHorizontalGridLines = gridElement => {
  const width = gridElement.getBoundingClientRect().width
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
    gridElement.appendChild(gridLine)
  })
}

const drawVerticalGridLines = gridElement => {
  const height = gridElement.getBoundingClientRect().height
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
    gridElement.appendChild(gridLine)
  })
}

const drawValue = (gridElement, row) => {
  const width = gridElement.getBoundingClientRect().width
  const height = gridElement.getBoundingClientRect().height
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
  gridElement.appendChild(textElement)
}

const drawInitialValues = (gridElement, initialValues) => {
  initialValues.forEach(row => drawValue(gridElement, row))
}

const clearCalculatedValues = gridElement => {
  const calculatedValues = gridElement.querySelectorAll('text[data-is-initial-value=false]')
  calculatedValues.forEach(calculatedValue => gridElement.removeChild(calculatedValue))
}

const drawCalculatedValues = (gridElement, rows) => {
  clearCalculatedValues(gridElement)
  const rowsWithCalculatedValues = rows.filter(row => !row.isInitialValue)
  rowsWithCalculatedValues.forEach(row => drawValue(gridElement, row))
}

export const drawInitialGrid = initialValues => {
  const gridElement = document.getElementById('sudoku')
  drawHorizontalGridLines(gridElement)
  drawVerticalGridLines(gridElement)
  drawInitialValues(gridElement, initialValues)
}

export const drawSolution = solution => {
  const gridElement = document.getElementById('sudoku')
  drawCalculatedValues(gridElement, solution)
}
