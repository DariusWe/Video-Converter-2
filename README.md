### FFMPEG Video Converter (Version 2)

- Install dependencies in client as well as server directory
- Run ``npm run devStart`` in server directory
- Run ``npm start`` in client directory
- Upload a video file, choose desired container format and hit "convert"

Files will be temporarily uploaded to the /uploads folder in the project (using Multer), than converted (using the fluent-ffmpeg module) and saved into the /converted folder. Once the process is finished, the original file in /uploads will be deleted. Server Sent Events are used to send the progress of the file conversion to the client.