import {createRoot} from 'react-dom/client'
import PreviewLayout from './preview'
const rootElm = document.getElementById('root') as HTMLElement
const root = createRoot(rootElm)
root.render(<PreviewLayout />)

const win: any = window
if (win?.CefWindow) {
  win.CefWindow.show()
}
