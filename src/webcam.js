import * as tf from '@tensorflow/tfjs'
import log from 'loglevel'

export class Webcam {

  constructor() {
    this.videoElement = null
    this.offScreenCanvas = null
  }

  get isActive() {
    return Boolean(this.videoElement)
  }

  async start(videoElement) {

    const videoRect = videoElement.getBoundingClientRect()
    log.info('[Webcam#start] videoRect:', videoRect)

    const constraints = {
      video: {
        facingMode: 'environment',
        width: videoRect.width,
        height: videoRect.height
      }
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

    if (mediaStream) {
      this.offScreenCanvas = document.createElement('canvas')
      this.offScreenCanvas.width = videoRect.width
      this.offScreenCanvas.height = videoRect.height
      this.videoElement = videoElement
      this.videoElement.srcObject = mediaStream
      this.videoElement.play()
    }
  }

  stop() {
    if (this.videoElement) {
      const mediaStream = this.videoElement.srcObject
      mediaStream.getVideoTracks().forEach(videoTrack => videoTrack.stop())
      this.videoElement.srcObject = null
      this.videoElement = null
    } else {
      log.warn('[Webcam#stop] Webcam not started!')
    }
  }

  async *frames() {

    const dx = 0
    const dy = 0
    const sx = 0
    const sy = 0
    const sw = this.offScreenCanvas.width
    const sh = this.offScreenCanvas.height

    while (this.videoElement) {
      performance.mark('captureWebcam-start')
      const ctx = this.offScreenCanvas.getContext('2d')
      ctx.drawImage(this.videoElement, dx, dy)
      const imageData = ctx.getImageData(sx, sy, sw, sh)
      performance.measure('captureWebcam', 'captureWebcam-start')
      yield imageData
      await tf.nextFrame()
    }
  }
}
