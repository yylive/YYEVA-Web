import {useEffect, useRef, useState} from 'react'
import {yyEva, YYEvaType, version} from 'yyeva'
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
      user_avatar: '/yy/1.jpeg',
      anchor_nick: 'boy',
      anchor_avatar: '/yy/2.jpeg',
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
    // useAccurate: false,
    // useVideoDBCache: false,
    // logLevel: 'info',
    // showPlayerInfo: 'table',
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
      <div className="buttomLink">
        <a href="https://github.com/yylive/YYEVA-Web" rel="noreferrer">
          Github YYEVA {version}
        </a>
      </div>
    </>
  )
}
