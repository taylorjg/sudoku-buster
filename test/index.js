import chai from 'chai'
import chaiAlmost from 'chai-almost'
import * as tf from '@tensorflow/tfjs'
import { findBoundingBox } from '../src/findBoundingBox.js'
import { scanPuzzle } from '../src/scan'
import { satisfiesAllConstraints, digitPredictionsToPuzzle } from '../src/puzzle'
import * as I from '../src/image'

const { expect } = chai
chai.use(chaiAlmost())

mocha
  .setup('bdd')
  .slow(5000)
  .timeout(5000)
  .checkLeaks()
  .globals(['__VUE_DEVTOOLS_TOAST__'])

describe('sudoku-buster tests', () => {

  let gridImageTensor = undefined
  let imageData = undefined
  let cellsModel = undefined

  before(async () => {
    gridImageTensor = await I.loadImage('/rawImages/00044.png')
    imageData = await I.imageTensorToImageData(gridImageTensor)
    cellsModel = await tf.loadLayersModel(`${location.origin}/models/cells/model.json`)
  })

  after(() => {
    gridImageTensor.dispose()
    cellsModel.dispose()
  })

  it('findBoundingBox', async () => {
    const gridImageTensorNormalised = I.normaliseGridImage(imageData)
    const [x, y, w, h] = await findBoundingBox(gridImageTensorNormalised)
    gridImageTensorNormalised.dispose()
    expect(x).to.be.almost(21, 3)
    expect(y).to.be.almost(30, 3)
    expect(w).to.be.almost(184, 3)
    expect(h).to.be.almost(184, 3)
  })

  it('scanPuzzle', async () => {
    const numTensorsBefore = tf.memory().numTensors
    const digitPredictions = await scanPuzzle(cellsModel, imageData)
    expect(satisfiesAllConstraints(digitPredictions)).to.be.true
    const actual = digitPredictionsToPuzzle(digitPredictions)
    const expected = [
      "28  3  45",
      "5 4   6 2",
      " 1 5 4 9 ",
      "  28 34  ",
      "8   7   3",
      "  36 29  ",
      " 4 1 5 2 ",
      "1 5   7 4",
      "63  4  19"
    ]
    expect(actual).to.deep.equal(expected)
    const numTensorsAfter = tf.memory().numTensors
    expect(numTensorsAfter).to.equal(numTensorsBefore)
  })
})

setTimeout(mocha.run, 0)
