import {yyEva, YYEvaType, version, YYEvaOptionsType} from 'yyeva'
import {useEffect, useRef} from 'react'

export const host = `${location.protocol}//${location.host}`
export type PlayerI = {
  options: Partial<YYEvaOptionsType>
}
export const Player = ({options}: PlayerI) => {
  let evideo: YYEvaType
  const div = useRef<HTMLDivElement>(null)
  const runPlayer = async (container: HTMLDivElement) => {
    options.container = container
    options.onEnd = () => {
      runPlayer(container)
    }
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
