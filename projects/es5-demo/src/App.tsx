import {yyEva, YYEvaType, version} from 'yyeva'
import {useEffect, useRef} from 'react'
let evideo: YYEvaType
const host = `https://dev.yy.com:3333`
const runPlayer = async (container: HTMLDivElement) => {
  evideo = await yyEva({
    mode: 'AspectFill',
    container,
    useMetaData: true,
    onEnd: () => runPlayer(container),
    loop: false,
    videoUrl: `${host}/m64.mp4`,
    usePrefetch: false,
    showVideo: true,
    logLevel: 'info',
    effects: {
      a1: `${host}/a1.png`,
      a2: `${host}/b1.png`,
    },
  })
  evideo.start()
}
const YYEVA = () => {
  const div = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('useEffect')
    if (div.current) runPlayer(div.current)
  }, [])
  return (
    <div className="yyeva">
      <h1 className="title">YYEVA {version}</h1>
      <div className="container" ref={div}></div>
    </div>
  )
}
export default YYEVA
