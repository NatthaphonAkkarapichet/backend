const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const cookieParser = require('cookie-parser')

const app = express()

app.get('/health', (req, res) => res.send('OK'))

app.use(cors())
app.use(cookieParser())
app.use(express.json())

app.use('/api', routes)

module.exports = app
