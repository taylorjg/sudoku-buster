import * as R from 'ramda'
import axios from 'axios'
import moment from 'moment'
import Chart from 'chart.js'
import { drawInitialValues, drawSolution } from '../src/drawSvg'
import { createSvgElement } from '../src/drawSvg'
import { showErrorPanel, hideErrorPanel } from '../src/errorPanel'

const PLACEHOLDER_URL_1 = 'https://via.placeholder.com/400x200.png?text=Performance+Data'
const PLACEHOLDER_URL_2 = 'https://via.placeholder.com/200x200.png?text=Webcam+Image'
const PLACEHOLDER_URL_3 = 'https://via.placeholder.com/200x200.png?text=Given+Values'
const PLACEHOLDER_URL_4 = 'https://via.placeholder.com/200x200.png?text=Solution'

let operationInProgress = false

const onDeleteAll = async () => {
  try {
    operationInProgress = true
    hideErrorPanel()
    await axios.delete('/api/scanMetrics')
    refreshTable()
  } catch (error) {
    showErrorPanel(error)
  } finally {
    operationInProgress = false
  }
}

const onDeleteById = async id => {
  try {
    operationInProgress = true
    hideErrorPanel()
    await axios.delete(`/api/scanMetrics/${id}`)
    refreshTable()
  } catch (error) {
    showErrorPanel(error)
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

  const duration = (item.duration / 1000).toFixed(2)

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
  tdDurationElement.innerText = duration
  tdFrameCountElement.innerText = item.frameCount
  tdFPSElement.innerText = fps.toFixed(2)

  summaryRow.addEventListener('click', () => onRowClick(item, summaryRow))

  return summaryRow
}

const drawImageOnCanvas = (canvasElement, src) => {
  const ctx = canvasElement.getContext('2d')
  const dx = 0
  const dy = 0
  const dWidth = canvasElement.width
  const dHeight = canvasElement.height
  const image = new Image()
  image.onload = () => ctx.drawImage(image, dx, dy, dWidth, dHeight)
  image.src = src
}

const drawImageOnSvg = (svgElement, src) => {
  const imageElement = createSvgElement('image', { href: src })
  svgElement.appendChild(imageElement)
}

// https://bl.ocks.org/emeeks/8cdec64ed6daf955830fa723252a4ab3
const COLOURS = [
  '#a6cee3',
  '#1f78b4',
  '#b2df8a',
  '#33a02c',
  '#fb9a99',
  '#e31a1c',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffff99',
  '#b15928'
]

const makeDatasets = markss => {
  const numDatasets = Math.max(...markss.map(marks => marks.length))
  return R.range(1, numDatasets).map(datasetIndex => ({
    backgroundColor: COLOURS[datasetIndex - 1],
    data: markss.map(marks => {
      if (datasetIndex >= marks.length) return 0
      const thisStartTime = marks[datasetIndex].startTime
      const previousStartTime = marks[datasetIndex - 1].startTime
      const diffTime = thisStartTime - previousStartTime
      return Number(diffTime.toFixed(2))
    }),
    label: markss.find(marks => datasetIndex < marks.length)[datasetIndex].name
  }))
}

const drawPerformanceData = (canvasElement, markss) => {
  const datasets = makeDatasets(markss)
  const labels = R.range(0, datasets[0].data.length).map(R.inc)
  const ctx = canvasElement.getContext('2d')
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets
    },
    options: {
      legend: {
        display: false
      },
      responsive: false,
      animation: {
        duration: 0
      },
      scales: {
        xAxes: [{
          stacked: true,
          categoryPercentage: 1.0,
          barPercentage: 1.0,
          gridLines: {
            display: false,
            drawBorder: false,
            drawTicks: false
          },
          ticks: {
            display: false,
          }
        }],
        yAxes: [{
          stacked: true,
          gridLines: {
            display: false,
            drawBorder: false,
            drawTicks: false
          },
          ticks: {
            display: false,
          }
        }]
      }
    }
  })
}

const createDetailsRow = (item, summaryRow) => {

  const makeSelector = (row, col, more = '') =>
    `table tr:nth-child(${row}) td:nth-child(${col}) ${more}`

  const template = document.getElementById('details-row-template')
  const documentFragment = document.importNode(template.content, true)
  const detailsRow = documentFragment.firstElementChild

  tbodyElement.insertBefore(documentFragment, summaryRow.nextSibling)

  const tdUserAgentElement = detailsRow.querySelector(makeSelector(1, 1))
  const chartCanvasElement = detailsRow.querySelector(makeSelector(2, 1, 'canvas'))
  const imageCanvasElement = detailsRow.querySelector(makeSelector(2, 2, 'canvas'))
  const initialValuesSvgElement = detailsRow.querySelector(makeSelector(2, 3, 'svg'))
  const solutionSvgElement = detailsRow.querySelector(makeSelector(2, 4, 'svg'))

  tdUserAgentElement.innerText = item.userAgent

  if (item.markss.length > 0) {
    drawPerformanceData(chartCanvasElement, item.markss)
  } else {
    drawImageOnCanvas(chartCanvasElement, PLACEHOLDER_URL_1)
  }

  if (item.imageDataURL) {
    drawImageOnCanvas(imageCanvasElement, item.imageDataURL)
  } else {
    drawImageOnCanvas(imageCanvasElement, PLACEHOLDER_URL_2)
  }

  if (item.solution) {
    drawInitialValues(initialValuesSvgElement, item.solution)
    drawInitialValues(solutionSvgElement, item.solution)
    drawSolution(solutionSvgElement, item.solution)
  } else {
    drawImageOnSvg(initialValuesSvgElement, PLACEHOLDER_URL_3)
    drawImageOnSvg(solutionSvgElement, PLACEHOLDER_URL_4)
  }

  return detailsRow
}

const populateTable = data =>
  data.forEach(createSummaryRow)

const refreshTable = async () => {
  try {
    operationInProgress = true
    hideErrorPanel()
    const { data } = await axios.get('/api/scanMetrics')
    clearTable()
    populateTable(data)
  } catch (error) {
    showErrorPanel(error)
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
  deleteAllButton.disabled = operationInProgress || tbodyElement.childElementCount === 0
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
