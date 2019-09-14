import * as R from 'ramda'
import * as C from './constants'

const digitOrBlank = indexedDigitPredictions => index => {
  const item = indexedDigitPredictions.find(R.propEq('index', index))
  return item
    ? String(item.digitPrediction)
    : C.BLANK
}

export const digitPredictionsToPuzzle = indexedDigitPredictions =>
  R.compose(
    R.splitEvery(9),
    R.join(C.EMPTY),
    R.map(digitOrBlank(indexedDigitPredictions))
  )(R.range(0, 81))

const setsOfRowIndices = R.splitEvery(9, R.range(0, 81))

const setsOfColIndices = R.transpose(setsOfRowIndices)

//  0,  1,  2,    3,  4,  5,    6,  7,  8,
//  9, 10, 11,   12, 13, 14,   15, 16, 17,
// 18, 19, 20,   21, 22, 23,   24, 25, 26,

// 27, 28, 29,   30, 31, 32,   33, 34, 35,
// 36, 37, 38,   39, 40, 41,   42, 43, 44,
// 45, 46, 47,   48, 49, 50,   51, 52, 53,

// 54, 55, 56,   57, 58, 59,   60, 61, 62,
// 63, 64, 65,   66, 67, 68,   69, 70, 71,
// 72, 73, 74,   75, 76, 77,   78, 79, 80

const setsOfBoxIndices = [
  [0, 1, 2, 9, 10, 11, 18, 19, 20],
  [3, 4, 5, 12, 13, 14, 21, 22, 23],
  [6, 7, 8, 15, 16, 17, 24, 25, 26],
  [27, 28, 29, 36, 37, 38, 45, 46, 47],
  [30, 31, 32, 39, 40, 41, 48, 49, 50],
  [33, 34, 35, 42, 43, 44, 51, 52, 53],
  [54, 55, 56, 63, 64, 65, 72, 73, 74],
  [57, 58, 59, 66, 67, 68, 75, 76, 77],
  [60, 61, 62, 69, 70, 71, 78, 79, 80]
]

// const rowColToBox = (row, col) =>
//   Math.floor(row - (row % 3) + (col / 3))

const validateIndices = digitPredictions => indices => {
  const digits = digitPredictions
    .filter(({ index }) => indices.includes(index))
    .map(({ digitPrediction }) => digitPrediction)
  return digits.length === R.uniq(digits).length
}

const validateSetsOfIndices = digitPredictions =>
  R.all(validateIndices(digitPredictions))

export const satisfiesAllConstraints = digitPredictions =>
  R.all(
    validateSetsOfIndices(digitPredictions),
    [
      setsOfRowIndices,
      setsOfColIndices,
      setsOfBoxIndices
    ]
  )
