import ReactDOM from 'react-dom/client'
import {RouterDom} from 'src/router'
// import PreviewLayout from './preview'
// ReactDOM.render(<PreviewLayout />, document.getElementById('root'))
const root = ReactDOM.createRoot(document.getElementById('root') as any)
root.render(<RouterDom />)
