import express from 'express'
import cors from 'cors'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'

// Express Setup
const app = express()
app.use(
  cors({
    origin: '*',
  })
)
app.use(express.json())
const PORT = 3001

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname.replaceAll(' ', ''))
  },
})

const upload = multer({ storage: storage })

// Routes
app.get('/stream', (req, res) => {
  // Set Headers necessary for SSE to work properly and flush these Headers to client immediatly
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // store the current SSE response object in the app instance (Express app instance)
  // This way SSE response object can be accessed in other routes using req.app.get()
  req.app.set('sseRes', res)

  // Clean up when the connection is closed
  req.on('close', () => {
    req.app.set('sseRes', null)
  })
})

app.post('/convert-video', upload.single('file'), (req, res) => {
  const sseRes = req.app.get('sseRes')
  const { outputContainer } = req.body
  const fileName = req.file.filename
  const inputFilePath = req.file.path.replaceAll('\\', '/')
  const outputFilePath = `converted/${fileName}.${outputContainer}`

  ffmpeg(inputFilePath)
    .format(outputContainer)
    .on('start', (commandLine) => {
      console.log('Started:', commandLine)
    })
    .on('progress', (progress) => {
      sseRes.write(`data: ${Math.round(progress.percent)}\n\n`)
    })
    .on('error', (error, stdout, stderr) => {
      console.log('An error has occured:', error.message)
    })
    .on('end', (stdout, stderr) => {
      console.log('Transcoding succeeded!')
      res.send(outputFilePath)
      fs.unlink(inputFilePath).catch((error) => console.log(error))
    })
    .save(outputFilePath)
})

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`)
})
