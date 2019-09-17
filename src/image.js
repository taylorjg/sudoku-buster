import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'
import * as C from './constants'

// key: url, value: tf.tensor3D
const IMAGE_CACHE = new Map()

export const loadImage = async url => {
  const existingImageTensor = IMAGE_CACHE.get(url)
  if (existingImageTensor) return existingImageTensor
  const promise = new Promise((resolve, reject) => {
    log.info(`[loadImage] loading ${url}`)
    const image = new Image()
    image.src = url
    image.onload = () => resolve(tf.browser.fromPixels(image, C.GRID_IMAGE_CHANNELS))
    image.onerror = () => reject(new Error(`Failed to load image, ${url}.`))
  })
  const imageTensor = await promise
  IMAGE_CACHE.set(url, imageTensor)
  return imageTensor
}

export const imageTensorToImageData = async imageTensor => {
  const canvas = document.createElement('canvas')
  await tf.browser.toPixels(imageTensor, canvas)
  const ctx = canvas.getContext('2d')
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export const imageDataToImageTensor = (imageData, numChannels = C.GRID_IMAGE_CHANNELS) =>
  tf.browser.fromPixels(imageData, numChannels)
