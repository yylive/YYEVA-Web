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
        mute: true,
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
        const op = {...options, ...d}
        // console.log('useOptionsStore options:', op)
        set(state => ({options: op}))
      },
    }),
  ),
)

export const useVideoStore = create(
  combine(
    {
      video: {
        videoUrl: `${host}/yy/pld_264_crf12.mp4`,
        // videoUrl: 'https://res.yy.com/fts/client/propswf/20397_1.mp4',
        effects: {
          // mp4_ext_user_nick: 'girl',
          1: '/yy/ball_6.png',
          // mp4_ext_recv_nick: 'boy',
          2: '/yy/ball_6 (1).png',
          key: 'YYEVA',
        },
      },
    },
    (set, get) => ({
      setVideo(video: any) {
        // console.log('video', video)
        set(state => ({video}))
      },
    }),
  ),
)

export const useBackgroundColorStore = create(
  combine(
    {
      backgroundColor: 'black',
    },
    (set, get) => ({
      setBackGoundColor(value: string) {
        set(state => ({backgroundColor: value}))
      },
    }),
  ),
)

export const useBackgroundGrid = create(
  combine(
    {
      showGrid: true,
    },
    (set, get) => ({
      setBackGoundGrid(value: boolean) {
        set(state => ({showGrid: value}))
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

export const useCodeStore = create(
  combine({opencode: false}, set => ({
    setOpenCode(opencode: boolean) {
      set(state => ({opencode}))
    },
  })),
)

export const useClickUploadStore = create(
  combine({upload: 0}, (set, get) => ({
    setClickUpload() {
      set(state => ({upload: get().upload + 1}))
    },
  })),
)
