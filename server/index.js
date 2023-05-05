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
/* 
ToDo: Find a better way to handle Server Sent Events. The following way of implementing SSE is not best-practice. Error and client handling are not handled well by this approach.
*/
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  req.app.set('sseRes', res)

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
      console.log('\nTranscoding succeeded!')
      res.send(outputFilePath)
      fs.unlink(inputFilePath).catch((error) => console.log(error))
    })
    .save(outputFilePath)
})

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`)
})
