import video from 'src/preview/config/video'
import {create} from 'zustand'
import {combine} from 'zustand/middleware'
const defaultOptions = {
  alphaDirection: 'right',
  mode: 'Fill',
  useMetaData: true,
  loop: true,
  useFrameCache: false,
  useVideoDBCache: false,
  mute: true,
  forceBlob: false,
  showVideo: false,
  showPlayerInfo: true,
  useAccurate: true,
  // logLevel: 'info',
  // renderType: 'webgl',
  renderType: 'webgpu',
  hevcUrl: undefined,
}
export const useVideoStore = create(
  combine(
    {
      video: {
        ...defaultOptions,
        ...video.default,
      },
    },
    (set, get) => ({
      setVideo(v: any) {
        set(state => ({
          video: {...state.video, ...defaultOptions, ...v},
        }))
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

export const usePlayerInfoStore = create(
  combine(
    {
      playerInfo: {},
    },
    (set, get) => ({
      setPlayerInfoStore(playerInfo: any) {
        // console.log('playerInfo', playerInfo)
        set(state => ({playerInfo}))
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
