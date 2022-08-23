import {useEffect, useRef} from 'react'
import {yyEva, YYEvaType} from 'yyeva'
import {useVideoStore, useOptionsStore, useEffectStore} from '../store/usePlayerStore'
let evideo: YYEvaType

// let i = 0
const runOnce = async (container: any, videos: any, options: any) => {
  // const o: any = videos[i]
  // i = i === videos.length - 1 ? 0 : i + 1
  // const o = videos
  evideo = await yyEva({
    ...options,
    // ...o,
    ...videos,
    container,
    onEnd: () => runOnce(container, videos, options),
  })
  evideo.start()
  // console.log('evideo', evideo?.renderer?.videoEntity?.config)
}
let v: HTMLVideoElement
export const GiftPlayer = () => {
  const div = useRef<HTMLDivElement>(null)
  const {video} = useVideoStore(state => state)
  const {options} = useOptionsStore(state => state)
  const {effect, setEffect} = useEffectStore(state => state)
  useEffect(() => {
    // i = 0
    runOnce(div.current, video, options).then(() => setEffect(evideo?.renderer?.videoEntity?.config?.effect))

    return () => {
      evideo.destroy()
    }
  }, [options, video])

  return <div className={`playbox ${options.mode}`} ref={div}></div>
}
