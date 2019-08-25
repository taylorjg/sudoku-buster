import * as tf from '@tensorflow/tfjs'
import * as log from 'loglevel'
import * as R from 'ramda'
import * as C from './constants'

// key: url, value: tf.tensor3D
const IMAGE_CACHE = new Map()

export const loadImage = async url => {
  const existingImageTensor = IMAGE_CACHE.get(url)
  if (existingImageTensor) return existingImageTensor
  const promise = new Promise((resolve, reject) => {
    log.info(`Loading ${url}`)
    const image = new Image()
    image.src = url
    image.onload = () => resolve(tf.browser.fromPixels(image, C.GRID_IMAGE_CHANNELS))
    image.onerror = () => reject(new Error(`Failed to load image, ${url}.`))
  })
  const imageTensor = await promise
  IMAGE_CACHE.set(url, imageTensor)
  return imageTensor
}

export const convertToGreyscale = imageData => {
  const width = imageData.width
  const height = imageData.height
  const numPixels = width * height
  const data = imageData.data
  const array = new Uint8ClampedArray(data.length)
  const bases = R.range(0, numPixels).map(index => index * 4)
  for (const base of bases) {
    const colourValues = data.slice(base, base + 4)
    const [r, g, b, a] = colourValues
    // https://imagemagick.org/script/command-line-options.php#colorspace
    // Gray = 0.212656*R+0.715158*G+0.072186*B
    const greyValue = 0.212656 * r + 0.715158 * g + 0.072186 * b
    array[base] = greyValue
    array[base + 1] = greyValue
    array[base + 2] = greyValue
    array[base + 3] = a
  }
  return new ImageData(array, width, height)
}

export const normaliseGridImage = imageData => {
  const imageDataGreyscale = convertToGreyscale(imageData)
  const imageTensorGreyscale = tf.browser.fromPixels(imageDataGreyscale, C.GRID_IMAGE_CHANNELS)
  return tf.image.resizeBilinear(imageTensorGreyscale, [C.GRID_IMAGE_HEIGHT, C.GRID_IMAGE_WIDTH])
}
