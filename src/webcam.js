import log from 'loglevel'

let videoElement = null
let offScreenCanvas = null

export const isWebcamStarted = () => Boolean(videoElement)

export const startWebcam = async videoElementToUse => {

  const videoRect = videoElementToUse.getBoundingClientRect()
  log.info('[startWebcam] videoRect:', videoRect)

  const constraints = {
    video: {
      facingMode: 'environment',
      width: videoRect.width,
      height: videoRect.height
    }
  }

  const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

  if (mediaStream) {
    offScreenCanvas = document.createElement('canvas')
    offScreenCanvas.width = videoRect.width
    offScreenCanvas.height = videoRect.height
    videoElement = videoElementToUse
    videoElement.srcObject = mediaStream
    videoElement.play()
  }
}

export const stopWebcam = () => {
  if (videoElement) {
    const mediaStream = videoElement.srcObject
    mediaStream.getVideoTracks().forEach(videoTrack => videoTrack.stop())
    videoElement.srcObject = null
    videoElement = null
  } else {
    log.warn('[stopWebcam] Webcam not started!')
  }
}

export const captureWebcam = () => {
  if (videoElement) {
    const ctx = offScreenCanvas.getContext('2d')
    ctx.drawImage(videoElement, 0, 0)
    return ctx.getImageData(0, 0, offScreenCanvas.width, offScreenCanvas.height)
  } else {
    log.warn('[captureWebcam] Webcam not started!')
    return undefined
  }
}

export function* captureWebcamGenerator() {

  const dx = 0
  const dy = 0
  const sx = 0
  const sy = 0
  const sw = offScreenCanvas.width
  const sh = offScreenCanvas.height

  for (; ;) {
    performance.mark('captureWebcam-start')
    const ctx = offScreenCanvas.getContext('2d')
    ctx.drawImage(videoElement, dx, dy)
    const imageData = ctx.getImageData(sx, sy, sw, sh)
    performance.measure('captureWebcam', 'captureWebcam-start')
    yield imageData
  }
}
