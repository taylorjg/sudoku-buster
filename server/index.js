require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const { default: sslRedirect } = require('heroku-ssl-redirect')
const path = require('path')

const { configureDb } = require('./db')
const { configureApi } = require('./api')

const PORT = process.env.PORT || 3090
const BUILD_FOLDER = path.resolve(__dirname, '..', 'build')
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/test'

const main = async () => {

  const db = await configureDb(MONGODB_URI)
  const apiRouter = configureApi(db)

  const app = express()
  app.use(morgan('dev'))
  app.use(sslRedirect(['production'], 301))
  app.use(express.json({ limit: '1mb' }))
  app.use('/api', apiRouter)
  app.use(express.static(BUILD_FOLDER))
  app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
}

main()
