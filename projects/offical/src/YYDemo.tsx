import {useEffect, useRef, useState} from 'react'
import {yyEva, YYEvaType} from 'yyeva'
import './reset.css'
import './YYDemo.css'
let evideo: YYEvaType
// const host = 'https://yyeva.netlify.app'
const host = ''
const videos = [
  {
    videoUrl: `${host}/yy/m64.mp4`,
    effects: {
      a1: '/yy/a1.png',
      a2: '/yy/b1.png',
    },
  },
  {
    videoUrl: `${host}/yy/yy.mp4`,

    effects: {
      user_nick: 'girl',
      user_avatar: 'https://downhdlogo.yy.com/hdlogo/640640/640/640/78/2624780478/u2624780478ZhhQq46.jpg',
      anchor_nick: 'boy',
      anchor_avatar: 'https://downhdlogo.yy.com/hdlogo/640640/640/640/01/0050018133/u50018133k68-pbY41.jpg',
    },
  },
]
let i = 0
const runOnce = async (container: any) => {
  const o: any = videos[i]
  i = i === 0 ? 1 : 0
  evideo = await yyEva({
    container,
    alphaDirection: 'right',
    ...o,
    mode: 'AspectFill',
    useMetaData: true,
    loop: false,
    useFrameCache: true,
    // useVideoDBCache: false,
    // logLevel: 'info',
    showPlayerInfo: 'table',
    onEnd: () => runOnce(container),
  })
  evideo.start()
}
let v: HTMLVideoElement
const GiftPlayer = () => {
  const div = useRef<HTMLDivElement>(null)
  useEffect(() => {
    runOnce(div.current)
    return () => {
      evideo.destroy()
    }
  }, [])

  return <div className="wrap" ref={div}></div>
}
export default function YYDemo() {
  return (
    <>
      <div className="container">
        <GiftPlayer />
      </div>
    </>
  )
}
