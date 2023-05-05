import express from 'express'
import cors from 'cors'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'
import events from 'events'
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
app.locals.progressEmitter = new (events.EventEmitter)();

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

// The following Server Sent Events (SSE) implementation cannot handle mutliple clients. 
// To handle multiple clients a unique id could be passed to the event emitter: 
// req.app.locals.progressEmitter.on(`progress-${uploadId}`, sendProgress);
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = (progress) => {
    res.write(`data: ${progress}\n\n`);
  };

  req.app.locals.progressEmitter.on('progress', sendProgress);

  req.on('close', () => {
    req.app.locals.progressEmitter.removeListener('progress', sendProgress);
  });
})

app.post('/convert-video', upload.single('file'), (req, res) => {
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
      req.app.locals.progressEmitter.emit('progress', Math.round(progress.percent));
    })
    .on('error', (error, stdout, stderr) => {
      console.log('An error has occured:', error.message)
      res.status(500).send(error.message)
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
