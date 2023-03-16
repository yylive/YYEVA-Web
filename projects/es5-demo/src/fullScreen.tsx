import {Player, host} from './player'
import {useEffect, useRef} from 'react'
const urls = ['https://yyeva.yy.com/yy/music.mp4', 'https://yyeva.yy.com/yy/yy.mp4']
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
          mode: 'AspectFill',
          mute: true,
          useMetaData: true,
          loop: false,
          // usePrefetch: false,
          showVideo: true,
          useAccurate: false,
          logLevel: 'info',
          videoUrl: getUrl(),
          // hevcUrl: `${host}/fh-265.mp4`,
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
