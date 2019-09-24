import axios from 'axios'
import moment from 'moment'

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

const onRowClick = (item, trElement) => {
  if (trElement.detailsRow) {
    tbodyElement.removeChild(trElement.detailsRow)
    delete trElement.detailsRow
  } else {
    const documentFragment = createDetailsRow(item)
    trElement.detailsRow = documentFragment.firstElementChild
    tbodyElement.insertBefore(documentFragment, trElement.nextSibling)
  }
}

const createSummaryRow = item => {

  const template = document.getElementById('summary-row-template')
  const summaryRow = document.importNode(template.content, true)

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

  const deleteButton = tdActionElement.querySelector('button')
  deleteButton.addEventListener('click', () => onDeleteById(item._id))

  tdVersionElement.innerText = item.version
  tdTimestampElement.innerText = timestamp
  tdOutcomeElement.innerText = item.outcome
  tdDurationElement.innerText = item.duration.toFixed(2)
  tdFrameCountElement.innerText = item.frameCount
  tdFPSElement.innerText = fps.toFixed(2)

  const trElement = summaryRow.firstElementChild
  trElement.addEventListener('click', () => onRowClick(item, trElement))

  return summaryRow
}

const createDetailsRow = item => {
  const template = document.getElementById('details-row-template')
  const detailsRow = document.importNode(template.content, true)
  const tdUserAgentElement = detailsRow.querySelector('.analytics-inner-table tr:nth-child(1) td:nth-child(1)')
  tdUserAgentElement.innerText = item.userAgent
  return detailsRow
}

const populateTable = data => {
  for (const item of data) {
    const documentFragment = createSummaryRow(item)
    tbodyElement.appendChild(documentFragment)
  }
}

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
  refreshTable()
  onIdle()
}

main()
