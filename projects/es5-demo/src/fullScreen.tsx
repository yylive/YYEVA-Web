import {Player, host} from './player'
import {useEffect, useRef} from 'react'
// const urls = ['https://yyeva.yy.com/yy/music.mp4', 'https://yyeva.yy.com/yy/mface.mp4']
const urls = ['https://yyeva.yy.com/yy/music.mp4']
let i = 0
const getUrl = () => {
  if (i > urls.length - 1) i = 0
  const url = urls[i]
  i++
  return url
}
const FullScreen = () => {
  const div = useRef<HTMLDivElement>(null)
  useEffect(() => {}, [])
  return (
    <div className="fullscreen">
      <Player
        getVideoUrl={getUrl}
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
          videoUrl: getUrl(),
          effects: {
            name: `YYEVAER`,
            fontColor: 'white',
            fontSize: 40,
          },
        }}
      />
    </div>
  )
}
export default FullScreen
