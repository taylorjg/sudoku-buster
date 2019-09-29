import axios from 'axios'

const scanMetricsInstance = axios.create({
  baseURL: '/api/scanMetrics'
})

export const deleteAll = () => scanMetricsInstance.delete()

export const deleteById = id => scanMetricsInstance.delete(`/${id}`)

export const getAll = async () => {
  const { data } = await scanMetricsInstance.get()
  return data
}
