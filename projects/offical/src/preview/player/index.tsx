import {useEffect, useRef} from 'react'
import UploadVideo from 'src/preview/player/UploadVideo'
import {type YYEvaOptionsType, type YYEvaType, yyEva} from 'yyeva'
import {
  useBackgroundGrid,
  useEffectStore,
  usePlayerInfoStore,
  useVideoFormStore,
  useVideoStore,
} from '../store/usePlayerStore'
let evideo: YYEvaType

const runOnce = async (container: any, video: any, onGetConfig?: any) => {
  // console.log('video', video)
  evideo = await yyEva({
    ...video,
    container,
    // loop: true,
    onEnd: (e: any) => {
      console.log('[runOnce]onEnd, e=', e)
      if (!e) runOnce(container, video)
    },
    onGetConfig: onGetConfig ? onGetConfig : () => {},
    onLoopCount: (args: any) => {
      // test case: loop: 1, loop: 2, loop: 3, loop: false, loop: true
      // [runOnce]onLoopCount args= {count: 1}
      // console.log('[runOnce]onLoopCount args=', args)
    },
  })
  evideo.start()
}
let v: HTMLVideoElement
export const GiftPlayer = ({backgroundColor}: any) => {
  const setPlayerInfoStore = usePlayerInfoStore(state => state.setPlayerInfoStore)
  //
  const {video} = useVideoStore(state => state)
  const {setVideoFormItem} = useVideoFormStore(state => state)
  const div = useRef<HTMLDivElement>(null)
  const {setEffect} = useEffectStore(state => state)
  const {showGrid} = useBackgroundGrid()
  // console.log('backgroundColor=', backgroundColor)

  useEffect(() => {
    runOnce(div.current, video, (op: YYEvaOptionsType) => {
      setPlayerInfoStore(op)
      // console.log('runOnce then op', op)
    }).then(op => {
      setEffect(evideo?.renderer?.videoEntity?.config?.effect)
      // setVideoFormItem({})
      setVideoFormItem({videoUrl: video.videoUrl, ...video.effects})
      //
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
