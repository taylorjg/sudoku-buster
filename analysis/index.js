import axios from 'axios'

const main = async () => {
  const { data } = await axios.get('/api/scanMetrics')
  const tableElement = document.querySelector('table tbody')
  for (const item of data) {
    const trElement = document.createElement('tr')
    const td1Element = document.createElement('td')
    const td2Element = document.createElement('td')
    const td3Element = document.createElement('td')
    const td4Element = document.createElement('td')
    const fps = item.frameCount / (item.duration / 1000)
    td1Element.innerText = item.outcome
    td2Element.innerText = item.duration.toFixed(2)
    td3Element.innerText = item.frameCount
    td4Element.innerText = fps.toFixed(2)
    trElement.appendChild(td1Element)
    trElement.appendChild(td2Element)
    trElement.appendChild(td3Element)
    trElement.appendChild(td4Element)
    tableElement.appendChild(trElement)
  }
}

main()
