import {createRoot} from 'react-dom/client'
// import {StrictMode} from 'react'
import App from './App'
const container = document.getElementById('emp-root') as HTMLElement
const root = createRoot(container)
root.render(<App />)
// =====================
// import ReactDOM from 'react-dom'
// import App from './App'
// ReactDOM.render(<App />, document.getElementById('emp-root'))

// =====================
// const video = document.createElement('video')
// document.body.appendChild(video)
// video.src = `https://dev.yy.com:3333/m64.mp4`
// video.play()
