import log from 'loglevel'
import * as R from 'ramda'

let module = undefined
let processImageWrapper = undefined

export const helloModuleLoaded = new Promise(resolve => {

  const wrapProcessImage = module => {
    log.info('[wrapProcessImage]')
    const ident = 'processImage'
    const returnType = 'number'
    const argTypes = ['array', 'number', 'number']
    const processImage = module.cwrap(ident, returnType, argTypes)
    return processImage
  }

  const init = helloModule => {
    log.info('[init]')
    module = helloModule
    processImageWrapper = wrapProcessImage(module)
    resolve()
  }

  window.createHelloModule().then(init)
})

const imageDataFrom1Channel = (data, width, height) => {
  log.info('[imageDataFrom1Channel]', { data, width, height })
  const cb = width * height * 4
  const array = new Uint8ClampedArray(cb)
  data.forEach((pixelValue, index) => {
    const base = index * 4
    array[base] = pixelValue
    array[base + 1] = pixelValue
    array[base + 2] = pixelValue
    array[base + 3] = 255
  })
  const imageData = new ImageData(array, width, height)
  return imageData
}

const imageDataFrom4Channels = (data, width, height) => {
  log.info('[imageDataFrom4Channels]', { data, width, height })
  const array = new Uint8ClampedArray(data)
  const imageData = new ImageData(array, width, height)
  return imageData
}

const unpackImage = ([width, height, channels, addr]) => {
  const numBytes = width * height * channels
  const data = module.HEAPU8.slice(addr, addr + numBytes)
  return channels === 1
    ? imageDataFrom1Channel(data, width, height)
    : imageDataFrom4Channels(data, width, height)
}

const unpackCorners = data32 => {
  return R.splitEvery(2, data32).map(([x, y]) => ({ x, y }))
}

const unpackContour = ([numPoints, addr]) => {
  const addr32 = addr / module.HEAP32.BYTES_PER_ELEMENT
  const data32 = module.HEAP32.slice(addr32, addr32 + numPoints * 2)
  return R.splitEvery(2, data32).map(([x, y]) => ({ x, y }))
}

const unpackProcessImageResult = addr => {
  const NUM_INT_FIELDS = 22
  const addr32 = addr / module.HEAP32.BYTES_PER_ELEMENT
  const data32 = module.HEAP32.slice(addr32, addr32 + NUM_INT_FIELDS)
  const boundingBox = data32.slice(0, 4)
  const image1 = unpackImage(data32.slice(4, 8))
  const image2 = unpackImage(data32.slice(8, 12))
  const corners = unpackCorners(data32.slice(12, 20))
  const contour = unpackContour(data32.slice(20, 22))
  return { boundingBox, image1, image2, corners, contour }
}

export const findBoundingBox = imageData => {
  const { data, width, height } = imageData
  const addr = processImageWrapper(data, width, height)
  if (addr === 0) return undefined
  const unpackedResult = unpackProcessImageResult(addr)
  module._free(addr)
  return unpackedResult
}
