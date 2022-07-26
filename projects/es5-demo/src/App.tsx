import {yyEva, YYEvaType, version} from 'yyeva'
import {useEffect, useRef} from 'react'
let evideo: YYEvaType
const host = `${location.protocol}//${location.host}`
const runPlayer = async (container: HTMLDivElement) => {
  evideo = await yyEva({
    mode: 'cover',
    container,
    useMetaData: true,
    onEnd: () => runPlayer(container),
    onGetConfig(op, options) {
      console.log('onGetConfig', op)
    },
    loop: false,
    videoUrl: `${host}/m64.mp4`,
    showVideo: true,
    logLevel: 'info',
    useVideoDBCache: false,
    showPlayerInfo: false,
    returnVideoUrl: true,
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
    if (div.current) runPlayer(div.current)
    return () => {
      console.log('evideo.destroy')
      evideo.destroy()
    }
  }, [])
  return (
    <div className="yyeva">
      <h1 className="title">YYEVA {version}</h1>
      <div className="container" ref={div}></div>
    </div>
  )
}
export default YYEVA
