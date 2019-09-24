import axios from 'axios'
import moment from 'moment'
import { drawInitialValues, drawSolution } from '../src/drawSvg'

const onDeleteAll = async () => {
  await axios.delete('/api/scanMetrics')
  refreshTable()
}

const onDeleteById = async id => {
  await axios.delete(`/api/scanMetrics/${id}`)
  refreshTable()
}

const clearTable = () => {
  while (tbodyElement.firstChild) {
    tbodyElement.removeChild(tbodyElement.firstChild)
  }
}

const onRowClick = (item, summaryRow) => {
  if (summaryRow.detailsRow) {
    tbodyElement.removeChild(summaryRow.detailsRow)
    delete summaryRow.detailsRow
  } else {
    summaryRow.detailsRow = createDetailsRow(item, summaryRow)
  }
}

const createSummaryRow = item => {

  const template = document.getElementById('summary-row-template')
  const documentFragment = document.importNode(template.content, true)
  const summaryRow = documentFragment.firstElementChild

  tbodyElement.appendChild(documentFragment)

  const tdVersionElement = summaryRow.querySelector('td:nth-child(1)')
  const tdTimestampElement = summaryRow.querySelector('td:nth-child(2)')
  const tdOutcomeElement = summaryRow.querySelector('td:nth-child(3)')
  const tdDurationElement = summaryRow.querySelector('td:nth-child(4)')
  const tdFrameCountElement = summaryRow.querySelector('td:nth-child(5)')
  const tdFPSElement = summaryRow.querySelector('td:nth-child(6)')
  const tdActionElement = summaryRow.querySelector('td:nth-child(7)')

  const timestamp = moment
    .utc(item.timestamp)
    .format('DD-MMM-YYYY HH:mm:ss')
    .toUpperCase()

  const fps = item.frameCount / (item.duration / 1000)

  tdActionElement.querySelector('button')
    .addEventListener('click', e => {
      e.stopPropagation()
      onDeleteById(item._id)
    })

  tdVersionElement.innerText = item.version
  tdTimestampElement.innerText = timestamp
  tdOutcomeElement.innerText = item.outcome
  tdDurationElement.innerText = item.duration.toFixed(2)
  tdFrameCountElement.innerText = item.frameCount
  tdFPSElement.innerText = fps.toFixed(2)

  summaryRow.addEventListener('click', () => onRowClick(item, summaryRow))

  return summaryRow
}

const drawImageDataURL = (canvas, imageDataURL) => {
  const ctx = canvas.getContext('2d')
  const dx = 0
  const dy = 0
  const dWidth = canvas.width
  const dHeight = canvas.height
  const image = new Image()
  image.onload = () => ctx.drawImage(image, dx, dy, dWidth, dHeight)
  image.src = imageDataURL
}

const createDetailsRow = (item, summaryRow) => {

  const makeSelector = (row, col, more = '') =>
    `table tr:nth-child(${row}) td:nth-child(${col}) ${more}`

  const template = document.getElementById('details-row-template')
  const documentFragment = document.importNode(template.content, true)
  const detailsRow = documentFragment.firstElementChild

  tbodyElement.insertBefore(documentFragment, summaryRow.nextSibling)

  const tdUserAgentElement = detailsRow.querySelector(makeSelector(1, 1))
  const canvasElement = detailsRow.querySelector(makeSelector(2, 1, 'canvas'))
  const initialValuesSvgElement = detailsRow.querySelector(makeSelector(2, 2, 'svg'))
  const solutionSvgElement = detailsRow.querySelector(makeSelector(2, 3, 'svg'))

  tdUserAgentElement.innerText = item.userAgent

  drawImageDataURL(canvasElement, item.imageDataURL)
  
  if (item.solution) {
    drawInitialValues(initialValuesSvgElement, item.solution)
    drawInitialValues(solutionSvgElement, item.solution)
    drawSolution(solutionSvgElement, item.solution)
  }

  return detailsRow
}

const populateTable = data =>
  data.forEach(createSummaryRow)

const refreshTable = async () => {
  const { data } = await axios.get('/api/scanMetrics')
  clearTable()
  populateTable(data)
}

const onRefresh = () => {
  refreshTable()
}

const refreshButton = document.getElementById('refresh-btn')
const deleteAllButton = document.getElementById('delete-all-btn')
const tbodyElement = document.querySelector('table tbody')

const onIdle = () => {
  deleteAllButton.disabled = !tbodyElement.hasChildNodes()
  requestAnimationFrame(onIdle)
}

const main = async () => {
  refreshButton.addEventListener('click', onRefresh)
  deleteAllButton.addEventListener('click', onDeleteAll)
  onIdle()
  refreshTable()
}

main()
