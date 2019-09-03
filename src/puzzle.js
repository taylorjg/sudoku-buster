import * as R from 'ramda'
import * as C from './constants'

const digitOrBlank = indexedDigitPredictions => index => {
  const item = indexedDigitPredictions.find(R.propEq('index', index))
  return item
    ? String(item.digitPrediction)
    : C.BLANK
}

export const digitPredictionsToInitialValues = digitPredictions =>
  R.compose(
    R.splitEvery(9),
    R.join(C.EMPTY),
    R.map(digitOrBlank(digitPredictions))
  )(R.range(0, 81))
