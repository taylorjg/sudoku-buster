import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'

let webcam = undefined

export const isWebcamStarted = () => !!webcam

export const startWebcam = async videoElement => {
  const videoRect = videoElement.getBoundingClientRect()
  log.info(`[startWebcam] videoRect: ${JSON.stringify(videoRect)}`)
  const width = Math.round(videoRect.width)
  const height = Math.round(videoRect.height)
  log.info(`[startWebcam] width: ${width}; height: ${height}`)
  const webcamConfig = { facingMode: 'environment' }
  videoElement.width = width
  videoElement.height = height
  webcam = await tf.data.webcam(videoElement, webcamConfig) //eslint-disable-line
}

export const captureWebcam = async () => {
  const gridImageTensor = await webcam.capture()
  webcam.stop()
  webcam = undefined // eslint-disable-line
  return gridImageTensor
}
