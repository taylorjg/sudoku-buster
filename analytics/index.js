import axios from 'axios'
import moment from 'moment'
import { drawInitialValues, drawSolution } from '../src/drawSvg'

let operationInProgress = false

const onDeleteAll = async () => {
  try {
    operationInProgress = true
    await axios.delete('/api/scanMetrics')
    refreshTable()
  } finally {
    operationInProgress = false
  }
}

const onDeleteById = async id => {
  try {
    operationInProgress = true
    await axios.delete(`/api/scanMetrics/${id}`)
    refreshTable()
  } finally {
    operationInProgress = false
  }
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
  const outcomeCompletedElement = summaryRow.querySelector('.outcome-completed')
  const outcomeCancelledElement = summaryRow.querySelector('.outcome-cancelled')
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
  const completed = item.outcome === 'completed'
  outcomeCompletedElement.style.display = completed ? 'inline' : 'none'
  outcomeCancelledElement.style.display = completed ? 'none' : 'inline'
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
  try {
    operationInProgress = true
    const { data } = await axios.get('/api/scanMetrics')
    clearTable()
    populateTable(data)
  } finally {
    operationInProgress = false
  }
}

const onRefresh = () => {
  refreshTable()
}

const loadingSpinnerElement = document.getElementById('loading-spinner')
const refreshButton = document.getElementById('refresh-btn')
const deleteAllButton = document.getElementById('delete-all-btn')
const tbodyElement = document.querySelector('table tbody')

const onIdle = () => {
  loadingSpinnerElement.style.display = operationInProgress ? 'inline-block' : 'none'
  refreshTable.disabled = operationInProgress
  deleteAllButton.disabled = operationInProgress || !tbodyElement.hasChildNodes()
  const deleteButtons = tbodyElement.querySelectorAll('tr td button')
  deleteButtons.forEach(deleteButton => deleteButton.disabled = operationInProgress)
  requestAnimationFrame(onIdle)
}

const main = async () => {
  refreshButton.addEventListener('click', onRefresh)
  deleteAllButton.addEventListener('click', onDeleteAll)
  onIdle()
  refreshTable()
}

main()
