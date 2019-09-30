import * as R from 'ramda'
import moment from 'moment'
import Chart from 'chart.js'
import { createSvgElement, drawInitialValues, drawSolution } from '../src/drawSvg'
import { showErrorPanel, hideErrorPanel } from '../src/errorPanel'
import * as db from './db'

const PLACEHOLDER_URL_1 = 'https://via.placeholder.com/400x200.png?text=Performance+Marks'
const PLACEHOLDER_URL_2 = 'https://via.placeholder.com/200x200.png?text=Webcam+Image'
const PLACEHOLDER_URL_3 = 'https://via.placeholder.com/200x200.png?text=Given+Values'
const PLACEHOLDER_URL_4 = 'https://via.placeholder.com/200x200.png?text=Solution'

let databaseCallInProgress = false

const doDatabaseCall = async fn => {
  try {
    databaseCallInProgress = true
    hideErrorPanel()
    const data = await fn()
    return data
  } catch (error) {
    showErrorPanel(error)
  } finally {
    databaseCallInProgress = false
  }
}

const populateLegend = data => {
  if (legendContainerElement.firstElementChild) return
  const completedItem = data.find(item => item.outcome === 'completed')
  if (completedItem) {
    const marks = R.last(completedItem.markss)
    marks.slice(1).forEach((mark, index) => {
      const template = document.getElementById('legend-item-template')
      const documentFragment = document.importNode(template.content, true)
      const legendColourElement = documentFragment.querySelector('.legend-item__colour')
      const legendNameElement = documentFragment.querySelector('.legend-item__name')
      legendColourElement.style.borderBottomColor = COLOURS[index]
      legendNameElement.innerText = mark.name
      legendContainerElement.appendChild(documentFragment)
    })
  }
}

const onDeleteAll = () =>
  doDatabaseCall(async () => {
    await db.deleteAll()
    await refreshTable()
  })

const onDeleteById = async id =>
  doDatabaseCall(async () => {
    await db.deleteById(id)
    await refreshTable()
  })

const clearTable = () => {
  while (tbodyElement.firstChild) {
    tbodyElement.removeChild(tbodyElement.firstChild)
  }
}

const onRowClick = async (item, summaryRow) => {
  if (summaryRow.detailsRow) {
    tbodyElement.removeChild(summaryRow.detailsRow)
    delete summaryRow.detailsRow
  } else {
    // eslint-disable-next-line require-atomic-updates
    summaryRow.detailsRow = await createDetailsRow(item, summaryRow)
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

const createDetailsRow = async (item, summaryRow) => {

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

  const imageDataURL = await doDatabaseCall(() => db.getImageDataURLById(item._id))

  if (imageDataURL) {
    drawImageOnCanvas(imageCanvasElement, imageDataURL)
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

const theadElement = document.querySelector('table thead')
const versionColumnElement = theadElement.querySelector('th:nth-child(1)')
const timestampColumnElement = theadElement.querySelector('th:nth-child(2)')
const outcomeColumnElement = theadElement.querySelector('th:nth-child(3)')
const durationColumnElement = theadElement.querySelector('th:nth-child(4)')
const frameCountColumnElement = theadElement.querySelector('th:nth-child(5)')
const fpsColumnElement = theadElement.querySelector('th:nth-child(6)')

const SORT_COLUMN_VERSION = Symbol('SORT_COLUMN_VERSION')
const SORT_COLUMN_TIMESTAMP = Symbol('SORT_COLUMN_TIMESTAMP')
const SORT_COLUMN_OUTCOME = Symbol('SORT_COLUMN_OUTCOME')
const SORT_COLUMN_DURATION = Symbol('SORT_COLUMN_DURATION')
const SORT_COLUMN_FRAME_COUNT = Symbol('SORT_COLUMN_FRAME_COUNT')
const SORT_COLUMN_FPS = Symbol('SORT_COLUMN_FPS')

const SORT_DIRECTION_ASCEND = Symbol('SORT_DIRECTION_ASCEND')
const SORT_DIRECTION_DESCEND = Symbol('SORT_DIRECTION_DESCEND')

const SORT_FILTER_ALL = Symbol('SORT_FILTER_ALL')
const SORT_FILTER_COMPLETED = Symbol('SORT_FILTER_COMPLETED')
const SORT_FILTER_CANCELLED = Symbol('SORT_FILTER_CANCELLED')

const SORT_COLUMN_ELEMENTS_MAP = new Map([
  [SORT_COLUMN_VERSION, versionColumnElement],
  [SORT_COLUMN_TIMESTAMP, timestampColumnElement],
  [SORT_COLUMN_OUTCOME, outcomeColumnElement],
  [SORT_COLUMN_DURATION, durationColumnElement],
  [SORT_COLUMN_FRAME_COUNT, frameCountColumnElement],
  [SORT_COLUMN_FPS, fpsColumnElement]
])

const SORT_COLUMN_FN_MAP = new Map([
  [SORT_COLUMN_VERSION, item => item.version],
  [SORT_COLUMN_TIMESTAMP, item => item.timestamp],
  [SORT_COLUMN_OUTCOME, item => item.outcome],
  [SORT_COLUMN_DURATION, item => item.duration],
  [SORT_COLUMN_FRAME_COUNT, item => item.frameCount],
  [SORT_COLUMN_FPS, item => item.frameCount / item.duration]
])

const SORT_DIRECTION_FN_MAP = new Map([
  [SORT_DIRECTION_ASCEND, R.ascend],
  [SORT_DIRECTION_DESCEND, R.descend]
])

const SORT_OPPOSITE_DIRECTION_MAP = new Map([
  [SORT_DIRECTION_ASCEND, SORT_DIRECTION_DESCEND],
  [SORT_DIRECTION_DESCEND, SORT_DIRECTION_ASCEND]
])

const SORT_FILTER_FN_MAP = new Map([
  [SORT_FILTER_ALL, R.identity],
  [SORT_FILTER_COMPLETED, R.filter(item => item.outcome === 'completed')],
  [SORT_FILTER_CANCELLED, R.filter(item => item.outcome === 'cancelled')]
])

let data = []
let currentSortColumn = SORT_COLUMN_TIMESTAMP
let currentSortDirections = new Map([
  [SORT_COLUMN_VERSION, SORT_DIRECTION_DESCEND],
  [SORT_COLUMN_TIMESTAMP, SORT_DIRECTION_DESCEND],
  [SORT_COLUMN_OUTCOME, SORT_DIRECTION_DESCEND],
  [SORT_COLUMN_DURATION, SORT_DIRECTION_ASCEND],
  [SORT_COLUMN_FRAME_COUNT, SORT_DIRECTION_ASCEND],
  [SORT_COLUMN_FPS, SORT_DIRECTION_DESCEND]
])
let currentSortFilter = SORT_FILTER_ALL

const sort = data => {
  const columnFn = SORT_COLUMN_FN_MAP.get(currentSortColumn)
  const currentSortDirection = currentSortDirections.get(currentSortColumn)
  const directionFn = SORT_DIRECTION_FN_MAP.get(currentSortDirection)
  const filterFn = SORT_FILTER_FN_MAP.get(currentSortFilter)
  return R.sort(directionFn(columnFn), filterFn(data))
}

const updateColumnHeaderArrows = () => {
  for (const [column, columnElement] of SORT_COLUMN_ELEMENTS_MAP.entries()) {
    const isCurrentSortColumn = column === currentSortColumn
    const currentSortDirection = currentSortDirections.get(column)
    const showUpArrow = isCurrentSortColumn && currentSortDirection === SORT_DIRECTION_ASCEND
    const showDownArrow = isCurrentSortColumn && currentSortDirection === SORT_DIRECTION_DESCEND
    columnElement.upArrow.style.display = showUpArrow ? 'inline-block' : 'none'
    columnElement.downArrow.style.display = showDownArrow ? 'inline-block' : 'none'
  }
}

const onColumnClick = column => () => {
  if (currentSortColumn === column) {
    const currentSortDirection = currentSortDirections.get(currentSortColumn)
    const oppositeDirection = SORT_OPPOSITE_DIRECTION_MAP.get(currentSortDirection)
    currentSortDirections.set(column, oppositeDirection)
  } else {
    currentSortColumn = column
  }
  data = sort(data)
  clearTable()
  data.forEach(item => {
    tbodyElement.appendChild(item.summaryRow)
    if (item.summaryRow.detailsRow) {
      tbodyElement.appendChild(item.summaryRow.detailsRow)
    }
  })
  updateColumnHeaderArrows()
}

const populateTable = data => {
  data.forEach(item => {
    item.summaryRow = createSummaryRow(item)
  })
}

const refreshTable = () =>
  doDatabaseCall(async () => {
    clearTable()
    data = []
    data = sort(await db.getAll())
    populateTable(data)
    populateLegend(data)
  })

const onRefresh = () => refreshTable()

const loadingSpinnerElement = document.getElementById('loading-spinner')
const legendContainerElement = document.getElementById('legend-container')
const refreshButton = document.getElementById('refresh-btn')
const deleteAllButton = document.getElementById('delete-all-btn')
const tbodyElement = document.querySelector('table tbody')

const initColumns = () => {
  for (const [column, columnElement] of SORT_COLUMN_ELEMENTS_MAP.entries()) {
    columnElement.addEventListener('click', onColumnClick(column))
    columnElement.upArrow = columnElement.querySelector('.up-arrow')
    columnElement.downArrow = columnElement.querySelector('.down-arrow')
  }
}

initColumns()
updateColumnHeaderArrows()

const onIdle = () => {
  loadingSpinnerElement.style.display = databaseCallInProgress ? 'inline-block' : 'none'
  refreshButton.disabled = databaseCallInProgress
  deleteAllButton.disabled = databaseCallInProgress || tbodyElement.childElementCount === 0
  const deleteButtons = tbodyElement.querySelectorAll('tr td button')
  deleteButtons.forEach(deleteButton => deleteButton.disabled = databaseCallInProgress)
  requestAnimationFrame(onIdle)
}

const main = async () => {
  refreshButton.addEventListener('click', onRefresh)
  deleteAllButton.addEventListener('click', onDeleteAll)
  onIdle()
  refreshTable()
}

main()
