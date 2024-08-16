import {javascript} from '@codemirror/lang-javascript'
import {dracula} from '@uiw/codemirror-theme-dracula'
import CodeMirror from '@uiw/react-codemirror'
import {Modal} from 'antd'
import {useCallback} from 'react'
import {useCodeStore, useVideoStore} from '../store/usePlayerStore'
const genCode = (o?: any) => {
  // console.log(o)
  const oString = JSON.stringify(o, null, 10)
  return `
import {yyEva, YYEvaType} from 'yyeva'
const App = ()=> {
    const div = useRef<HTMLDivElement>(null)
    useEffect(() => {
    let yyeva: YYEvaType
    (async()=>{
        yyeva = await yyEva({
          "container": div.current,${oString.substring(1).substring(0, oString.length - 2)}
        })
        yyeva.start()
    })()
    return () => {
        yyeva.destroy()
    }
    }, [])
  return <div ref={div}></div>
}
export default App
`
}
const CodePreview = () => {
  const {opencode, setOpenCode} = useCodeStore(state => state)
  const {video} = useVideoStore(state => state)
  const onChange = useCallback((value: any, viewUpdate: any) => {
    // console.log('value:', value)
  }, [])
  return (
    <Modal onCancel={() => setOpenCode(false)} onOk={() => setOpenCode(false)} open={opencode}>
      <CodeMirror
        value={genCode(video)}
        theme={dracula}
        height="500px"
        extensions={[javascript({jsx: true})]}
        onChange={onChange}
      />
    </Modal>
  )
}

export default CodePreview
