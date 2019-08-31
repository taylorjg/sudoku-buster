import chai from 'chai'
import chaiAlmost from 'chai-almost'
import { findBoundingBox } from '../src/findBoundingBox.js'
import * as I from '../src/image'

const { expect } = chai
chai.use(chaiAlmost())

mocha.setup('bdd')
mocha.slow(3000)
mocha.timeout(3000)
mocha.checkLeaks()
mocha.globals(['__VUE_DEVTOOLS_TOAST__'])

describe('sudoku-buster tests', () => {
  it('findBoundingBox', async () => {
    const gridImageTensor = await I.loadImage('/rawImages/00044.png')
    const imageData = await I.imageTensorToImageData(gridImageTensor)
    const gridImageTensorNormalised = I.normaliseGridImage(imageData)
    const [x, y, w, h] = await findBoundingBox(gridImageTensorNormalised)
    expect(x).to.be.almost(21, 3)
    expect(y).to.be.almost(30, 3)
    expect(w).to.be.almost(184, 3)
    expect(h).to.be.almost(184, 3)
  })
})

setTimeout(mocha.run, 0)
