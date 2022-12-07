import {createRoot} from 'react-dom/client'
// import 'antd/dist/antd.min.css'
import PreviewLayout from './preview'
const rootElm = document.getElementById('emp-root') as HTMLElement
const root = createRoot(rootElm)
root.render(<PreviewLayout />)
