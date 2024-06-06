import {useEffect, useRef} from 'react'
import {Player} from './player'

const Lambo = () => {
  const div = useRef<HTMLDivElement>(null)
  useEffect(() => {}, [])
  return (
    <div className="lambo">
      <Player
        options={{
          videoID: 'yyeva_right_top_position',
          useMetaData: true,
          loop: false,
          logLevel: 'info',
          useAccurate: false,
          videoUrl: `https://yyeva.yy.com/jcx/lambo.mp4`,
          effects: {
            key1: 'YYEVAER',
          },
        }}
      />
    </div>
  )
}
export default Lambo

// https://yyeva.yy.com/jcx/lambo.mp4
