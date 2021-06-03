import log from 'loglevel'

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

export const findBoundingBox = async imageData => {
  const { data, width, height } = imageData
  const addr = processImageWrapper(data, width, height)
  if (addr === 0) return undefined
  const returnDataAddr = addr / module.HEAP32.BYTES_PER_ELEMENT
  const returnData = module.HEAP32.slice(returnDataAddr, returnDataAddr + 20)
  const [
    bbx, bby, bbw, bbh,
    , , , ,
    outImage2Width, outImage2Height, outImage2Channels, outImage2Addr
  ] = returnData

  const boundingBox = [bbx, bby, bbw, bbh]

  const corners = [0, 1, 2, 3].map(cornerIndex => ({
    x: returnData[12 + cornerIndex * 2],
    y: returnData[12 + cornerIndex * 2 + 1]
  }))

  const outImage2DataSize = outImage2Width * outImage2Height * outImage2Channels
  const outImage2Data = module.HEAPU8.slice(outImage2Addr, outImage2Addr + outImage2DataSize)
  const imageDataCorrected = outImage2Channels === 1
    ? imageDataFrom1Channel(outImage2Data, outImage2Width, outImage2Height)
    : imageDataFrom4Channels(outImage2Data, outImage2Width, outImage2Height)

  module._free(addr)

  return {
    contour: [],
    corners,
    boundingBox,
    imageDataCorrected
  }
}
