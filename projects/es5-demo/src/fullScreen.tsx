import {Player, host} from './player'
import {useEffect, useRef} from 'react'
// const urls = ['https://yyeva.yy.com/yy/music.mp4', 'https://yyeva.yy.com/yy/mface.mp4']
const opts = [
  {
    videoUrl: 'https://yyeva.yy.com/yy/music.mp4',
    effects: {
      'keyname.png': 'music video',
      key: 'https://yyeva.yy.com/yy/q1.jpeg',
    },
  },
]
let i = 0
const getOpt: any = () => {
  if (i > opts.length - 1) i = 0
  const opt = opts[i]
  i++
  return opt
}
const FullScreen = () => {
  const div = useRef<HTMLDivElement>(null)
  useEffect(() => {}, [])
  return (
    <div className="fullscreen">
      <Player
        options={{
          videoID: 'yyeva_full_screen_position',
          mode: 'AspectFill',
          mute: false,
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
          ...getOpt(),
        }}
      />
    </div>
  )
}
export default FullScreen
