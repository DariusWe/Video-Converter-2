import express from 'express'
import cors from 'cors'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'

// Express Setup
const app = express()
app.use(cors())
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
app.post('/convert-video', upload.single('file'), (req, res) => {
  const { outputContainer } = req.body
  const fileName = req.file.filename
  const inputFilePath = req.file.path.replaceAll('\\', '/')
  const outputFilePath = `converted/${fileName}.${outputContainer}`

  // res.setHeader('Content-Type', 'text/event-stream')

  ffmpeg(inputFilePath)
    .format(outputContainer)
    .on('start', (commandLine) => {
      console.log('Started:', commandLine)
    })
    .on('progress', (progress) => {
      console.log('Processing:', progress.percent)
      // res.write(progress.percent)
    })
    .on('error', (error, stdout, stderr) => {
      console.log('An error has occured:', error.message)
    })
    .on('end', (stdout, stderr) => {
      console.log('Transcoding succeeded!')
      res.send(outputFilePath)
    })
    .save(outputFilePath)
})

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`)
})
