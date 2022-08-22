import create from 'zustand'
import {combine} from 'zustand/middleware'
const host = ''
export const useOptionsStore = create(
  combine(
    {
      alphaDirection: 'right',
      mode: 'Fill',
      useMetaData: true,
      loop: true,
      useFrameCache: true,
      mute: true,
      useVideoDBCache: true,
      forceBlob: false,
      showVideo: false,
      showPlayerInfo: true,
      useAccurate: true,
      logLevel: 'info',
    },
    set => ({
      setOptions(d: any) {
        set(state => ({...state, ...d}))
      },
    }),
  ),
)

export const useVideoStore = create(
  combine(
    {
      videoUrl: `${host}/yy/yy.mp4`,
      effects: {
        user_nick: 'girl',
        user_avatar: '/yy/1.jpeg',
        anchor_nick: 'boy',
        anchor_avatar: '/yy/2.jpeg',
      },
    },
    set => ({
      setVideo(d: any) {
        set(state => ({...d}))
      },
    }),
  ),
)

export const useEffectStore = create(
  combine({data: {}}, set => ({
    setEffect(d: any) {
      set(state => ({data: d}))
    },
  })),
)
