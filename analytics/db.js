import axios from 'axios'
import * as R from 'ramda'

const scanMetricsInstance = axios.create({
  baseURL: '/api/scanMetrics'
})

export const deleteAll = () =>
  scanMetricsInstance.delete()

export const deleteById = id =>
  scanMetricsInstance.delete(`/${id}`)

export const getAll = async params => {
  const filteredParams = R.filter(value => value !== '', params)
  const { data } = await scanMetricsInstance.get(undefined, { params: filteredParams })
  return data
}

export const getImageDataURLById = async id => {
  const { data } = await scanMetricsInstance.get(`/${id}/imageDataURL`)
  return data
}
