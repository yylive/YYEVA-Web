import {yyEva, YYEvaType, version, YYEvaOptionsType} from 'yyeva'
import {useEffect, useRef} from 'react'

export const host = `${location.protocol}//${location.host}`
export type PlayerI = {
  options: Partial<YYEvaOptionsType>
  getVideoUrl?: () => string
}
export const Player = ({options, getVideoUrl}: PlayerI) => {
  let evideo: YYEvaType
  const div = useRef<HTMLDivElement>(null)
  const runPlayer = async (container: HTMLDivElement) => {
    options.container = container
    options.onEnd = () => {
      //   options.onEnd && options.onEnd(options)
      if (getVideoUrl) options.videoUrl = getVideoUrl()
      runPlayer(container)
    }
    //
    // if (getVideoUrl) options.videoUrl = getVideoUrl()
    evideo = await yyEva(options as any)
    evideo.start()
  }
  useEffect(() => {
    if (div.current) runPlayer(div.current)
    return () => {
      evideo.destroy()
    }
  }, [])
  return <div className="yyeva" ref={div}></div>
}
