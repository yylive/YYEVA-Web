import {useEffect, useRef} from 'react'
import {yyEva, YYEvaType} from 'yyeva'
import {useVideoStore, useEffectStore, useVideoFormStore, useBackgroundGrid} from '../store/usePlayerStore'
import UploadVideo from 'src/preview/player/UploadVideo'
let evideo: YYEvaType
const state = 'show'
let currentFrame = 0
const runOnce = async (container: any, video: any) => {
  // console.log('video',video)
  if (evideo) {
    evideo.destroy()
    evideo = null
  }
  evideo = await yyEva({
    ...video,
    container,
    loop: 1,
    checkWindowStateWhenPlay: true,
    onEnd: e => {
      console.info('player', 'onEnd')
      hasCheck = false
      clearInterval(it)
      evideo.destroy()
    },
    onStart: e => {
      console.info('player', 'onStart')
      evideo.onStart = null as any
    },
  })
  const w = window.document.body.clientWidth
  if (w > 1500) {
    evideo.start()
  }
  commit()
}
const commit = () => {
  const w = window.document.body.clientWidth
  const totalFrame = evideo.getTotalFrame()
  if (w < 1500) {
    currentFrame = evideo.getCurrentFrame()
    evideo.setWindowState('hide')
    clearInterval(it)
    hasCheck = true
    it = setInterval(() => {
      currentFrame += evideo.fps
      console.info('player currentFrame', currentFrame, totalFrame)
      if (currentFrame >= totalFrame) {
        currentFrame = 0
        console.info('player', 'onEnd')
        hasCheck = false
        clearInterval(it)
        evideo.destroy()
      }
    }, 1000)
  } else {
    if (!hasCheck) return
    hasCheck = false
    clearInterval(it)
    const video = evideo.getVideo()
    const nowTime = (currentFrame / totalFrame) * video.duration
    evideo.setCurrentTime(nowTime)
    console.info('nowTime', nowTime)
    evideo.setWindowState('show')
  }
}
let v: HTMLVideoElement
let it: any = null
let hasCheck = false
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

    window.addEventListener('resize', () => {
      commit()
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
