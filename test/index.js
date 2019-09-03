import chai from 'chai'
import chaiAlmost from 'chai-almost'
import * as tf from '@tensorflow/tfjs'
import { findBoundingBox } from '../src/findBoundingBox.js'
import { scanPuzzle } from '../src/scan'
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
  let blanksModel = undefined
  let digitsModel = undefined

  before(async () => {
    gridImageTensor = await I.loadImage('/rawImages/00044.png')
    imageData = await I.imageTensorToImageData(gridImageTensor)
    const models = await Promise.all([
      tf.loadLayersModel(`${location.origin}/models/blanks/model.json`),
      tf.loadLayersModel(`${location.origin}/models/digits/model.json`)
    ])
    blanksModel = models[0]
    digitsModel = models[1]
  })

  after(() => {
    gridImageTensor.dispose()
    blanksModel.dispose()
    digitsModel.dispose()
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
    const actual = await scanPuzzle(blanksModel, digitsModel, imageData)
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
