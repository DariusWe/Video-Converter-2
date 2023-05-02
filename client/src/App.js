import './App.css'
import { useState } from 'react'

function App() {
  const [videoFile, setVideoFile] = useState(null)
  const [outputContainer, setOutputContainer] = useState('')
  // const [progress, setProgress] = useState('')
  const [convertedFilePath, setConvertedFilePath] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Listen to events from server (not working as SSE is only working for GET Methods)
  // const eventSource = new EventSource('http://localhost:3001/convert-video')
  // eventSource.onmessage = (event) => {
  //   setProgress(event.data)
  // }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setIsLoading(true)

    const formData = new FormData()
    formData.append('file', videoFile)
    formData.append('outputContainer', outputContainer)

    try {
      const response = await fetch(`http://localhost:3001/convert-video`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.text()
      setConvertedFilePath(data)
      setIsLoading(false)
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <label htmlFor="file">Upload video file:</label>
        <input id="file" type="file" name="file" onChange={(e) => setVideoFile(e.target.files?.[0])}></input>
        <span>
          <input
            type="radio"
            id="mp4"
            name="convert-to"
            value="mp4"
            checked={outputContainer === 'mp4'}
            onChange={(e) => setOutputContainer(e.target.value)}
          />
          <label htmlFor="mp4">mp4</label>
        </span>
        <span>
          <input
            type="radio"
            id="mov"
            name="convert-to"
            value="mov"
            checked={outputContainer === 'mov'}
            onChange={(e) => setOutputContainer(e.target.value)}
          />
          <label htmlFor="mov">mov</label>
        </span>
        <span>
          <input
            type="radio"
            id="avi"
            name="convert-to"
            value="avi"
            checked={outputContainer === 'avi'}
            onChange={(e) => setOutputContainer(e.target.value)}
          />
          <label htmlFor="avi">avi</label>
        </span>
        <button type="submit" disabled={isLoading}>
          Convert
        </button>
      </form>
      {convertedFilePath && <span className="response-msg">Video successfully uploaded to {convertedFilePath}</span>}
    </div>
  )
}

export default App
