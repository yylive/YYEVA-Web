import {useEffect, useRef, useState} from 'react'
import {yyEva, YYEvaType, version} from 'yyeva'
import {usePlayer} from './configHook'
let evideo: YYEvaType

let i = 0
const runOnce = async (container: any, videos: any, options: any) => {
  const o: any = videos[i]
  i = i === videos.length - 1 ? 0 : i + 1
  evideo = await yyEva({
    ...options,
    ...o,
    container,
    onEnd: () => runOnce(container, videos, options),
  })
  evideo.start()
}
let v: HTMLVideoElement
export const GiftPlayer = () => {
  const div = useRef<HTMLDivElement>(null)
  const {videos, options} = usePlayer()
  useEffect(() => {
    runOnce(div.current, videos, options)
    return () => {
      evideo.destroy()
    }
  }, [options])

  return <div className="wrap" ref={div}></div>
}
