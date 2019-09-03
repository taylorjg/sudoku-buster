import * as tf from '@tensorflow/tfjs'
import * as C from './constants'

let blanksModel = undefined
let digitsModel = undefined

const primeModels = () => {
  const canvas = document.createElement('canvas')
  canvas.width = C.DIGIT_IMAGE_WIDTH
  canvas.height = C.DIGIT_IMAGE_HEIGHT
  const imageTensor = tf.browser.fromPixels(canvas, C.DIGIT_IMAGE_CHANNELS)
  const xs = imageTensor.expandDims()
  blanksModel.predict(xs)
  digitsModel.predict(xs)
}

export const loadModels = async () => {
  const models = await Promise.all([
    tf.loadLayersModel(`${location.origin}/models/blanks/model.json`),
    tf.loadLayersModel(`${location.origin}/models/digits/model.json`)
  ])
  blanksModel = models[0]
  digitsModel = models[1]
  primeModels()
}

export const getBlanksModel = () => blanksModel
export const getDigitsModel = () => digitsModel
