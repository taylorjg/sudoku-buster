import * as tf from '@tensorflow/tfjs'
import * as CALC from './calculations'

export const drawGridSquare = (canvas, gridSquare, colour) => {
  const ctx = canvas.getContext('2d')
  ctx.strokeStyle = colour
  ctx.lineWidth = 1
  ctx.strokeRect(...gridSquare)
}

export const drawGridSquares = (canvas, boundingBox, colour) => {
  const ctx = canvas.getContext('2d')
  for (const gridSquare of CALC.calculateGridSquares(boundingBox)) {
    ctx.strokeStyle = colour
    ctx.lineWidth = 1
    ctx.strokeRect(...gridSquare)
  }
}

export const drawBoundingBox = (canvas, boundingBox, colour) => {
  const ctx = canvas.getContext('2d')
  ctx.strokeStyle = colour
  ctx.lineWidth = 1
  ctx.strokeRect(...boundingBox)
}

export const drawGridImageTensor = async (parentElement, imageTensor) => {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('class', 'grid-image')
  await tf.browser.toPixels(imageTensor, canvas)
  parentElement.appendChild(canvas)
  return canvas
}
