const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 3090
const distFolder = path.resolve(__dirname, '..', 'dist')
const app = express()
app.use(express.static(distFolder))
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`))
