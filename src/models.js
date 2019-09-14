import * as tf from '@tensorflow/tfjs'
import * as C from './constants'

let cellsModel = undefined

const primeModel = () =>
  tf.tidy(() => {
    const canvas = document.createElement('canvas')
    canvas.width = C.DIGIT_IMAGE_WIDTH
    canvas.height = C.DIGIT_IMAGE_HEIGHT
    const imageTensor = tf.browser.fromPixels(canvas, C.DIGIT_IMAGE_CHANNELS)
    const xs = imageTensor.expandDims()
    cellsModel.predict(xs)
  })

export const loadModels = async () => {
  cellsModel = await tf.loadLayersModel(`${location.origin}/models/cells/model.json`)
  primeModel()
}

export const getCellsModel = () => cellsModel
