import {useEffect, useRef} from 'react'
import {yyEva, YYEvaType} from 'yyeva'
import {useVideoStore, useEffectStore, useVideoFormStore, useBackgroundGrid} from '../store/usePlayerStore'
import UploadVideo from 'src/preview/player/UploadVideo'
let evideo: YYEvaType

const runOnce = async (container: any, video: any) => {
  // console.log('video',video)
  evideo = await yyEva({
    ...video,
    container,
    // loop: true,
    onEnd: e => {
      console.log('[runOnce]onEnd, e=', e)
      if (!e) runOnce(container, video)
    },
    onLoopCount: (args: any) => {
      // test case: loop: 1, loop: 2, loop: 3, loop: false, loop: true
      // [runOnce]onLoopCount args= {count: 1}
      console.log('[runOnce]onLoopCount args=', args)
    },
  })
  evideo.start()
}
let v: HTMLVideoElement
export const GiftPlayer = ({backgroundColor}: any) => {
  const {video} = useVideoStore(state => state)
  const {setVideoFormItem} = useVideoFormStore(state => state)
  const div = useRef<HTMLDivElement>(null)
  const {setEffect} = useEffectStore(state => state)
  const {showGrid} = useBackgroundGrid()
  // console.log('backgroundColor=', backgroundColor)

  useEffect(() => {
    runOnce(div.current, video).then(() => {
      setEffect(evideo?.renderer?.videoEntity?.config?.effect)
      // setVideoFormItem({})
      setVideoFormItem({videoUrl: video.videoUrl, ...video.effects})
    })
    return () => {
      evideo.destroy()
    }
  }, [video])

  return (
    <UploadVideo>
      <div
        className={`playbox ${video.mode} ${showGrid ? '' : 'withoutgrid'}`}
        style={{backgroundColor: backgroundColor}}
        ref={div}
      ></div>
    </UploadVideo>
  )
}
