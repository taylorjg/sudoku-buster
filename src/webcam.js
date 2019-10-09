import log from 'loglevel'

let started = false
let savedVideoElement = undefined
let canvas = undefined
let ctx = undefined

export const isWebcamStarted = () => started

export const startWebcam = async videoElement => {

  const videoRect = videoElement.getBoundingClientRect()
  log.info(`[startWebcam] videoRect: ${JSON.stringify(videoRect)}`)

  const constraints = {
    video: {
      facingMode: 'environment',
      width: videoRect.width,
      height: videoRect.height
    }
  }

  const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

  if (mediaStream) {
    canvas = document.createElement('canvas')
    canvas.width = videoRect.width
    canvas.height = videoRect.height
    ctx = canvas.getContext('2d')
    savedVideoElement = videoElement
    savedVideoElement.srcObject = mediaStream
    savedVideoElement.play()
    started = true
  }
}

export const stopWebcam = () => {
  if (started) {
    const mediaStream = savedVideoElement.srcObject
    mediaStream.getVideoTracks().forEach(videoTrack => videoTrack.stop())
    savedVideoElement.srcObject = null
    savedVideoElement = undefined
    ctx = undefined
    canvas = undefined
    started = false
  } else {
    throw new Error('Webcam not started!')
  }
}

export const captureWebcam = async () => {
  if (started) {
    ctx.drawImage(savedVideoElement, 0, 0)
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  } else {
    return undefined
  }
}
