import * as functions from 'firebase-functions'
import express from 'express'

const app = express()
app.use(express.json())

// TODO: register routes
// import apiRouter from './src/routes/api'
// import webhookRouter from './src/routes/webhook'
// app.use('/api', apiRouter)
// app.use('/webhook', webhookRouter)

export const api = functions.https.onRequest(app)
export const webhook = functions.https.onRequest(app)
