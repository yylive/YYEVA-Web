import {yyEva, YYEvaType, version} from 'yyeva'
import {useEffect, useRef} from 'react'
let evideo: YYEvaType
const host = `${location.protocol}//${location.host}`
const runPlayer = async (container: HTMLDivElement) => {
  evideo = await yyEva({
    mode: 'AspectFill',
    container,
    useMetaData: true,
    onEnd: () => runPlayer(container),
    loop: false,
    usePrefetch: false,
    showVideo: true,
    logLevel: 'info',
    videoUrl: `${host}/960-360.mp4`,
    resizeCanvas: undefined,
    effects: {
      key1: `ken`,
    },
    // videoUrl: `${host}/m64.mp4`,
    // effects: {
    //   a1: `${host}/a1.png`,
    //   a2: `${host}/b1.png`,
    // },
  })
  evideo.start()
}
const YYEVA = () => {
  const div = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (div.current) runPlayer(div.current)
    return () => {
      console.log('evideo.destroy')
      evideo.destroy()
    }
  }, [])
  return (
    <div className="yyeva">
      {/* <h1 className="title">YYEVA {version}</h1> */}
      <div className="container" ref={div}></div>
    </div>
  )
}
export default YYEVA
