const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const hbs = require('hbs')
const cors = require('cors')
require('./db/mongoose')
const investment = require('./routers/investmentRoute')
const TronWeb = require('tronweb')
const cron = require('node-cron')

const app = express()
const port = process.env.PORT || 3000
// app.use(cors);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(investment.router)

const publicDirectoryPath = path.join(__dirname, './public')
const viewsPath = path.join(__dirname, './templates/views')
const partialsPath = path.join(__dirname, './templates/partials')

app.use(bodyParser.json())

app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

app.use(express.static(publicDirectoryPath))

app.get('', (req, res) => {
  res.render('index')
})

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/about', (req, res) => {
  res.render('about')
})

app.get('/check', (req, res) => {
  res.render('check')
})

cron.schedule('*/5 * * * *', () => {
  // console.log('Cron job after every 5 minutes')
  investment.eventListenerForCalls()
})

app.listen(port, () => {
  console.log('Server is listening for calls on port: ' + port)
})
