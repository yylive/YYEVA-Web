import create from 'zustand'
import {combine} from 'zustand/middleware'
const host = ''
export const useOptionsStore = create(
  combine(
    {
      options: {
        alphaDirection: 'right',
        mode: 'Fill',
        useMetaData: true,
        loop: true,
        useFrameCache: true,
        mute: false,
        useVideoDBCache: true,
        forceBlob: false,
        showVideo: false,
        showPlayerInfo: true,
        useAccurate: true,
        logLevel: 'info',
        renderType: 'webgl',
      },
    },
    (set, get) => ({
      setOptions(d: any) {
        const {options} = get()
        set(state => ({options: {...options, ...d}}))
      },
    }),
  ),
)

export const useVideoStore = create(
  combine(
    {
      video: {
        videoUrl: `${host}/yy/yy.mp4`,
        videoFile: null,
        effects: {
          user_nick: 'girl',
          user_avatar: '/yy/1.jpeg',
          anchor_nick: 'boy',
          anchor_avatar: '/yy/2.jpeg',
        },
      },
    },
    (set, get) => ({
      setVideo(video: any) {
        set(state => ({video}))
      },
    }),
  ),
)
export const useVideoFormStore = create(
  combine(
    {
      videoFormItem: {},
    },
    (set, get) => ({
      setVideoFormItem(videoFormItem: any) {
        set(state => ({videoFormItem}))
      },
    }),
  ),
)

export const useEffectStore = create(
  combine({effect: []}, set => ({
    setEffect(d: any) {
      set(state => ({effect: d}))
    },
  })),
)
