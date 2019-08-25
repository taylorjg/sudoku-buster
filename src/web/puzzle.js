import * as R from 'ramda'
import * as C from './constants'

export const flattenInitialValues = R.compose(R.unnest, R.map(Array.from))

const digitOrSpace = indexedDigitPredictions => index => {
  const indexedDigitPrediction = indexedDigitPredictions.find(R.propEq('index', index))
  return indexedDigitPrediction
    ? indexedDigitPrediction.digitPrediction.toString()
    : C.SPACE
}

export const indexedDigitPredictionsToInitialValues = indexedDigitPredictions =>
  R.compose(
    R.splitEvery(9),
    R.join(C.EMPTY),
    R.map(digitOrSpace(indexedDigitPredictions))
  )(R.range(0, 81))
