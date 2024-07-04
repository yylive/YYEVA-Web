import {useEffect, useRef} from 'react'
import {type YYEvaOptionsType, type YYEvaType, yyEva} from 'yyeva'

export const host = `${location.protocol}//${location.host}`
export type PlayerI = {
  playOpt: () => Partial<YYEvaOptionsType>
}
export const Player = ({playOpt}: PlayerI) => {
  let evideo: YYEvaType
  const div = useRef<HTMLDivElement>(null)
  const runPlayer = async (container: HTMLDivElement) => {
    const options = playOpt()
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
