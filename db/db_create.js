const main = async () => {
  try {
    const collection = db.scanMetrics
    const createAscendingAndDescendingIndexes = async property => {
      await collection.createIndex({ [property]: 1 })
      await collection.createIndex({ [property]: -1 })
    }
    await createAscendingAndDescendingIndexes('version')
    await createAscendingAndDescendingIndexes('timestamp')
    await createAscendingAndDescendingIndexes('outcome')
    await createAscendingAndDescendingIndexes('duration')
    await createAscendingAndDescendingIndexes('frameCount')
    await createAscendingAndDescendingIndexes('fps')
  } catch (error) {
    print(`ERROR: ${error.message}`)
  }
}

main()
