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

const populateTable = data => {
  for (const item of data) {

    const trElement = document.createElement('tr')
    const tdVersionElement = document.createElement('td')
    const tdTimestampElement = document.createElement('td')
    const tdOutcomeElement = document.createElement('td')
    const tdDurationElement = document.createElement('td')
    const tdFrameCountElement = document.createElement('td')
    const tdFPSElement = document.createElement('td')
    const tdActionElement = document.createElement('td')

    const timestamp = moment
      .utc(item.timestamp)
      .format('DD-MMM-YYYY HH:mm:ss')
      .toUpperCase()

    const fps = item.frameCount / (item.duration / 1000)

    const deleteButton = document.createElement('button')
    deleteButton.setAttribute('class', 'btn btn-xs btn-danger')
    deleteButton.innerText = 'Delete'
    deleteButton.addEventListener('click', () => onDeleteById(item._id))

    tdVersionElement.innerText = item.version
    tdTimestampElement.innerText = timestamp
    tdOutcomeElement.innerText = item.outcome
    tdDurationElement.innerText = item.duration.toFixed(2)
    tdFrameCountElement.innerText = item.frameCount
    tdFPSElement.innerText = fps.toFixed(2)
    tdActionElement.appendChild(deleteButton)

    trElement.appendChild(tdVersionElement)
    trElement.appendChild(tdTimestampElement)
    trElement.appendChild(tdOutcomeElement)
    trElement.appendChild(tdDurationElement)
    trElement.appendChild(tdFrameCountElement)
    trElement.appendChild(tdFPSElement)
    trElement.appendChild(tdActionElement)
    tbodyElement.appendChild(trElement)
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
