// https://stackoverflow.com/a/18650828
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const LABEL_WIDTH = 12

const printLabelAndValue = (label, value) => {
  const paddedLabel = `${label}:`.padEnd(LABEL_WIDTH)
  print(`${paddedLabel}${value}`)
}

printLabelAndValue('count', db.scanMetrics.count())

const size = db.scanMetrics.stats().size
printLabelAndValue('size', formatBytes(size))

printLabelAndValue('nindexes', db.scanMetrics.getIndexes().length)
