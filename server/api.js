const express = require('express')

const configureApi = db => {

  const postScanMetrics = async (req, res, next) => {
    try {
      const userAgent = req.headers['user-agent'] || ''
      await db.writeScanMetrics({ ...req.body, userAgent })
      res.status(201).end()
    } catch (error) {
      next(error)
    }
  }

  const getScanMetrics = async (_, res, next) => {
    try {
      const documents = await db.getScanMetrics()
      res.json(documents)
    } catch (error) {
      next(error)
    }
  }

  const getScanMetricsById = async (req, res, next) => {
    try {
      const document = await db.getScanMetricsById(req.params.id)
      document ? res.json(document) : res.status(404).end()
    } catch (error) {
      next(error)
    }
  }

  const getImageDataURLById = async (req, res, next) => {
    try {
      const document = await db.getImageDataURLById(req.params.id)
      return document
        ? res.json(document.imageDataURL || '')
        : res.status(404).end()
    } catch (error) {
      next(error)
    }
  }

  const deleteScanMetrics = async (_, res, next) => {
    try {
      await db.deleteScanMetrics()
      res.end()
    } catch (error) {
      next(error)
    }
  }

  const deleteScanMetricsById = async (req, res, next) => {
    try {
      const result = await db.deleteScanMetricsById(req.params.id)
      result ? res.end() : res.status(404).end()
    } catch (error) {
      next(error)
    }
  }

  const router = express.Router()

  router.post('/scanMetrics', postScanMetrics)
  router.get('/scanMetrics', getScanMetrics)
  router.get('/scanMetrics/:id', getScanMetricsById)
  router.get('/scanMetrics/:id/imageDataURL', getImageDataURLById)
  router.delete('/scanMetrics', deleteScanMetrics)
  router.delete('/scanMetrics/:id', deleteScanMetricsById)

  return router
}

module.exports = {
  configureApi
}
