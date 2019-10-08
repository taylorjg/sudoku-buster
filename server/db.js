const { MongoClient, ObjectId } = require('mongodb')

const configureDb = async url => {

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }

  const client = new MongoClient(url, options)

  try {
    console.log(`Attempting to connect to MongoDB at "${url}"...`)
    await client.connect()
    console.log('Successfully connected to MongoDB')

  } catch (error) {
    console.log('Failed to connect to MongoDB')
    console.log(error.message)
    throw error
  }

  const db = client.db()

  const SCAN_METRICS_COLLECTION = 'scanMetrics'
  const scanMetricsCollection = db.collection(SCAN_METRICS_COLLECTION)

  return {

    writeScanMetrics: scanMetrics =>
      scanMetricsCollection.insertOne(scanMetrics),

    getScanMetrics: async ({
      outcome = '',
      sortColumn = 'timestamp',
      sortDirection = -1,
      page = 1,
      pageSize = 10 } = {}) => {
      const query = outcome ? { outcome } : {}
      const options = {
        sort: { [sortColumn]: sortDirection === 'asc' ? 1 : -1 },
        skip: (Number(page) - 1) * pageSize,
        limit: Number(pageSize)
      }
      const totalCount = await scanMetricsCollection.estimatedDocumentCount()
      const cursor = scanMetricsCollection.find(query, options)
      const matchingCount = await cursor.count()
      const records = await cursor.project({ imageDataURL: false }).toArray()
      return {
        records,
        totalCount,
        matchingCount
      }
    },

    getScanMetricsById: id =>
      scanMetricsCollection.findOne({ _id: ObjectId(id) }),

    getImageDataURLById: async id => {
      const record = await scanMetricsCollection.findOne({ _id: ObjectId(id) })
      if (record) return { imageDataURL: record.imageDataURL }
      return undefined
    },

    deleteScanMetrics: () =>
      scanMetricsCollection.deleteMany({}),

    deleteScanMetricsById: async id => {
      const result = await scanMetricsCollection.deleteOne({ _id: ObjectId(id) })
      return result.deletedCount === 1
    }
  }
}

module.exports = {
  configureDb
}
