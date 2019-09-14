const express = require('express')
const sslRedirect = require('heroku-ssl-redirect')
const path = require('path')
const PORT = process.env.PORT || 3090
const distFolder = path.resolve(__dirname, '..', 'dist')
const app = express()
app.use(sslRedirect(['production'], 301))
app.use(express.static(distFolder))
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
