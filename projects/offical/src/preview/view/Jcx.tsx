import {useEffect, useRef} from 'react'
import {type YYEvaType, yyEva} from 'yyeva'
let player: YYEvaType
const Jcx = () => {
  const div: any = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ;(async () => {
      player = await yyEva({
        videoUrl: '/jcx/lambo.mp4',
        container: div.current,
        useMetaData: true,
        mute: true,
        logLevel: 'info',
        effects: {
          key1: 'YYEVAER',
        },
      })
      player.start()
    })()
    return () => {
      player.destroy()
    }
  }, [])
  return <div className="meta-jcx" ref={div}></div>
}

export default Jcx
