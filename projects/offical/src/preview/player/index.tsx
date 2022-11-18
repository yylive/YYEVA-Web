import {useEffect, useRef} from 'react'
import {yyEva, YYEvaType} from 'yyeva'
import {
  useVideoStore,
  useOptionsStore,
  useEffectStore,
  useVideoFormStore,
  useBackgroundGrid,
} from '../store/usePlayerStore'
import UploadVideo from 'src/preview/player/UploadVideo'
let evideo: YYEvaType

const runOnce = async (container: any, video: any, options: any) => {
  evideo = await yyEva({
    ...options,
    ...video,
    container,
    onEnd: e => {
      if (!e) runOnce(container, video, options)
    },
  })
  evideo.start()
}
let v: HTMLVideoElement
export const GiftPlayer = ({backgroundColor}: any) => {
  const {video} = useVideoStore(state => state)
  const {setVideoFormItem} = useVideoFormStore(state => state)
  const div = useRef<HTMLDivElement>(null)
  const {options} = useOptionsStore(state => state)
  const {setEffect} = useEffectStore(state => state)
  const {showGrid} = useBackgroundGrid()
  console.log('backgroundColor=', backgroundColor)

  useEffect(() => {
    runOnce(div.current, video, options).then(() => {
      setEffect(evideo?.renderer?.videoEntity?.config?.effect)
      // setVideoFormItem({})
      setVideoFormItem({videoUrl: video.videoUrl, ...video.effects})
    })
    return () => {
      evideo.destroy()
    }
  }, [options, video])

  return (
    <UploadVideo>
      <div
        className={`playbox ${options.mode} ${showGrid ? '' : 'withoutgrid'}`}
        style={{backgroundColor: backgroundColor}}
        ref={div}
      ></div>
    </UploadVideo>
  )
}
