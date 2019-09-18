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

  let imageTensor = undefined
  let cellsModel = undefined

  before(async () => {
    imageTensor = await I.loadImage('/rawImages/00044.png')
    cellsModel = await tf.loadLayersModel(`${location.origin}/models/cells/model.json`)
  })

  after(() => {
    imageTensor.dispose()
    cellsModel.dispose()
  })

  describe('findBoundingBox', () => {
    it('should find the correct bounding box', async () => {
      const imageData = await I.imageTensorToImageData(imageTensor)
      const { boundingBox } = await findBoundingBox(imageData)
      const [x, y, w, h] = boundingBox
      const TOLERANCE = 3
      expect(x).to.be.almost(21, TOLERANCE)
      expect(y).to.be.almost(30, TOLERANCE)
      expect(w).to.be.almost(184, TOLERANCE)
      expect(h).to.be.almost(184, TOLERANCE)
    })
  })

  describe('scanPuzzle', () => {

    it('should predict the correct initial values', async () => {
      const digitPredictions = await scanPuzzle(cellsModel, imageTensor)
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
    })

    it('should not leak any tensors', async () => {
      const numTensorsBefore = tf.memory().numTensors
      await scanPuzzle(cellsModel, imageTensor)
      const numTensorsAfter = tf.memory().numTensors
      expect(numTensorsAfter).to.equal(numTensorsBefore)
    })
  })

  describe('satisfiesAllConstraints', () => {

    it('should succeed given an empty collection of predictions', () => {
      expect(satisfiesAllConstraints([])).to.be.true
    })

    it('should succeed given the result of a successful scan', async () => {
      const digitPredictions = await scanPuzzle(cellsModel, imageTensor)
      expect(satisfiesAllConstraints(digitPredictions)).to.be.true
    })

    it('should fail given a row with a duplicate digit', () => {
      const digitPredictions = [
        { digitPrediction: 4, index: 0 },
        { digitPrediction: 9, index: 2 },
        { digitPrediction: 4, index: 6 }
      ]
      expect(satisfiesAllConstraints(digitPredictions)).to.be.false
    })

    it('should fail given a column with a duplicate digit', () => {
      const digitPredictions = [
        { digitPrediction: 7, index: 1 },
        { digitPrediction: 7, index: 10 },
        { digitPrediction: 5, index: 19 }
      ]
      expect(satisfiesAllConstraints(digitPredictions)).to.be.false
    })

    it('should fail given a 3x3 box with a duplicate digit', () => {
      const digitPredictions = [
        { digitPrediction: 3, index: 2 },
        { digitPrediction: 3, index: 20 }
      ]
      expect(satisfiesAllConstraints(digitPredictions)).to.be.false
    })
  })
})

setTimeout(mocha.run, 0)
