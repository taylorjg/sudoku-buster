const { Dlx } = require('dlxlib')
const R = require('ramda')

const noop = () => {}

const solve = (puzzle, onStep = noop, onSolution = noop) => {
  const rows = buildRows(puzzle)
  const matrix = buildMatrix(rows)
  const dlx = new Dlx()
  const resolveRowIndices = rowIndices => rowIndices.map(rowIndex => rows[rowIndex])
  dlx.on('step', e => onStep(resolveRowIndices(e.partialSolution), e.stepIndex))
  dlx.on('solution', e => onSolution(resolveRowIndices(e.solution), e.solutionIndex))
  return dlx.solve(matrix)
}

const ROWS = R.range(0, 9)
const COLS = R.range(0, 9)
const DIGITS = R.range(1, 10)

const buildRows = puzzle => {
  const cells = R.chain(row => R.map(col => ({ row, col }), COLS), ROWS)
  return R.chain(buildRowsForCell(puzzle), cells)
}

const lookupInitialValue = (puzzle, { row, col }) => {
  const ch = puzzle[row][col]
  const n = Number(ch)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

const buildRowsForCell = puzzle => coords => {
  const initialValue = lookupInitialValue(puzzle, coords)
  return initialValue
    ? [{ coords, value: initialValue, isInitialValue: true }]
    : DIGITS.map(digit => ({ coords, value: digit, isInitialValue: false }))
}

const buildMatrix = rows => rows.map(buildMatrixRow)

const buildMatrixRow = ({ coords, value }) => {
  const { row, col } = coords
  const box = rowColToBox(row, col)
  const posColumns = oneHot(row, col)
  const rowColumns = oneHot(row, value - 1)
  const colColumns = oneHot(col, value - 1)
  const boxColumns = oneHot(box, value - 1)
  return [].concat(posColumns, rowColumns, colColumns, boxColumns)
}

const rowColToBox = (row, col) =>
  Math.floor(row - (row % 3) + (col / 3))

const oneHot = (major, minor) =>
  R.update(major * 9 + minor, 1, R.repeat(0, 9 * 9))

module.exports = {
  solve
}
