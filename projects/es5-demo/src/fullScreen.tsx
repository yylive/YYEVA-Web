import {useEffect, useRef} from 'react'
import {Player, host} from './player'
// const urls = ['https://yyeva.yy.com/yy/music.mp4', 'https://yyeva.yy.com/yy/mface.mp4']
const opts = [
  {
    videoUrl: '/yy/music.mp4',
    effects: {
      'keyname.png': 'music video',
      key: '/yy/q1.jpeg',
    },
  },
  {
    videoUrl: '/yy/pld_264_new.mp4',
    effects: {
      1: '/yy/b6.png',
      2: '/yy/b6c.png',
      key: 'face swap',
    },
  },
]

let i = 0
const getOpt: any = () => {
  if (i > opts.length - 1) i = 0
  const opt = opts[i]
  i++
  return {
    videoID: 'yyeva_full_screen_position',
    mode: 'AspectFill',
    mute: true,
    useMetaData: true,
    loop: false,
    // usePrefetch: false,
    // showVideo: true,
    useAccurate: false,
    logLevel: 'info',
    // videoUrl: getUrl(),
    // effects: {
    //   name: `YYEVAER`,
    //   fontColor: 'white',
    //   fontSize: 40,
    // },
    useFrameCache: true,
    renderType: 'canvas2d',
    ...opt,
  }
}
const FullScreen = () => {
  const div = useRef<HTMLDivElement>(null)
  useEffect(() => {}, [])
  return (
    <div className="fullscreen">
      <Player playOpt={getOpt} />
    </div>
  )
}
export default FullScreen
