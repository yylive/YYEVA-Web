// import {LOG_LEVEL} from 'src/helper/log'

import {LogTypes} from 'src/helper/logger'

/**
 * 日志级别
 */
export type LoggerLevelType = 'trace' | 'debug' | 'info' | 'log' | 'time' | 'warn' | 'error' | 'off'

export type AlphaDirection = 'left' | 'right'
export type EventCallback = undefined | ((...args: any) => void)
//AspectFill 竖屏 AspectFit 横屏
export type ModeType = 'AspectFill' | 'AspectFit' | 'Fill' | 'vertical' | 'horizontal' | 'contain' | 'cover'

export enum EPlayError {
  NotAllowedError = 'NotAllowedError', // 不允许播放 需要交互
}

export enum EPlayStep {
  canplaythrough = 'canplaythrough', // 已经加载到可以播放的情度
  muted = 'muted', // 设为静音后再次播放
}

export interface onErrorEvent {
  playError: EPlayError
  playStep: EPlayStep
  video: HTMLVideoElement
}
export type ResizeCanvasType = 'percent' | 'percentW' | 'percentH' | 'size'

export type MixEvideoOptions = VideoEvent & {
  /**
   * 全屏模式模式
   */
  mode?: ModeType
  /**
   * debug 模式显示视频情况
   * @default false
   */
  showVideo?: boolean
  /**
   * web worker 模式 ::TODO
   */
  useWorker?: boolean
  /**
   * 循环播放
   * @default true
   */
  loop?: boolean | number
  /**
   * 动画容器
   */
  container: HTMLElement
  /**
   * video http 连接 或 file 对象
   */
  videoUrl: string | File
  /**
   * video id
   * 用来做唯一播放对象处理 不重复注销video标签 适配微信 (目前是支持多video标签)
   * @default null
   */
  videoID?: string
  /**
   * 描述文件连接
   */
  dataUrl?: string
  /**
   * 主要是指 mimeType MIME媒体类型
   * https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/isTypeSupported
   */
  mimeCodec?: string
  /**
   * 设置后主动降帧
   */
  fps?: number
  /**
   * 制定播放帧 ::TODO
   */
  offset?: number
  /**
   * MSE 预加载模式
   * @default true
   */
  usePrefetch?: boolean
  /**
   * 启动静音 适配 chrome 自动播放
   * @default true
   */
  mute?: boolean
  /**
   * 使用bitmap 替代 imageElm 离屏模式必须
   * @default true
   */
  useBitmap?: boolean
  /**
   * 启用 requestVideoFrameCallback,自动判断是否支持并且降级为 requestAnimationFrame
   * @default true
   */
  useAccurate?: boolean
  /**
   * 非 mix模式下 判断左右视频 ::TODO 加入上下模式
   * @default left
   */
  alphaDirection?: AlphaDirection
  /**
   * 渲染模式
   * @default webgl
   */
  renderType?: 'webgl' | 'canvas2d'
  /**
   * 兼容vap 启动后 不需要填写 dataUrl
   * usePrefetch 强制打开
   * @default false
   */
  useMetaData?: boolean
  /**
   * 字体全局配置
   */
  color?: string
  style?: string
  fontStyle?: string | any
  font?: {
    overflow: 'zoom' | 'cut' //  适配文本框宽度方式,超出文本框时:  'zoom'缩放  'cut'截取后段文本...
  }
  /**
   * effects
   * 业务内容 k 为 effectTag
   * text 可以加入 text
   */
  effects?: {
    [k: string]: any
    fontColor?: string
    fontSize?: number
    fontStyle?: string
  }
  /**
   * useVideoDBCache 使用视频缓存
   * @default true
   */
  useVideoDBCache?: boolean
  /**
   * useFrameCache 使用缓存帧 与 帧数
   * @default 5
   */
  useFrameCache?: boolean | number
  /**
   * useOfsRender 使用 多canvas 渲染同步
   * @default false
   */
  useOfsRender?: boolean
  /**
   * resizeCanvas
   * 设置 canvas大小
   * @options percent 为 width 100% height 100%
   * @options percentW 为 width 100%
   * @options percentH 为 height 100%
   * @options size 为 原尺寸
   * @default percent
   */
  resizeCanvas?: ResizeCanvasType
  /**
   * @default info
   */
  logLevel?: LogTypes
  /**
   * showPlayerInfo
   * @default true
   */
  showPlayerInfo?: boolean | 'table'
  /**
   * onRequestClickPlay
   * 微信&安卓端不能自动播放
   * mute=false 不能自动播放
   * 需要回调点击事件用户通过 video.play()触发一次
   */
  onRequestClickPlay?: (container: HTMLElement, video: HTMLVideoElement) => void
  // [key: string]: any
  /**
   * forceBlob
   * 强制使用 blob 不受polyfill 影响
   * @default false
   */
  forceBlob?: boolean
  /**
   * 播放超时开关
   * @default false
   */
  checkTimeout?: boolean
}

export type VideoDataInfoType = {
  videoW: number
  videoH: number
  w: number
  h: number
  fps: number
  isVapx: number
  rgbFrame: number[]
  aFrame: number[]
  mediaTime?: number
}
export type VideoDataSrcType = {
  w: number
  h: number
  srcId: number
  srcTag: string
  srcType: string
  img?: ImageData | HTMLImageElement | ImageBitmap
  textStr?: string
  color?: string
  style?: string
  fontStyle?: string | any
}
export type VideoDataFrameType = {
  i: number
  obj: VideoDataFrameObjType[]
}
export type VideoDataFrameObjType = {
  frame: number[]
  srcId: number
  mFrame: number[]
}
export type VideoDataType = {
  info: VideoDataInfoType
  src: VideoDataSrcType[]
  frame: VideoDataFrameType[]
}

export type MetaDataType = {
  /**
   * 视频当前帧
   */
  presentedFrames: number
  presentationTime: number
  expectedDisplayTime: number
  width: number
  height: number
  processingDuration: number
  /**
   * 视频当前播放时间
   */
  mediaTime: number
}

type RemoveField<T, Field> = {
  [K in keyof T as Exclude<K, Field>]: T[K]
}
export type EVideoPlayerType = {
  op: RemoveField<MixEvideoOptions, 'container'>
  className?: string
  events?: VideoEvent
}
export type VideoEvent = {
  onStart?: EventCallback
  onResume?: EventCallback
  onPause?: EventCallback
  onStop?: EventCallback
  onProcess?: EventCallback
  onEnd?: EventCallback
  onError?: EventCallback
}

export type VideoAnimateType = {
  /**
   * 每一帧的动态元素位置信息
   */
  datas: VideoAnimateDataType[]
  /**
   * 视频的描述信息
   */
  descript: VideoAnimateDescriptType
  /**
   * 动态元素的遮罩描述信息
   */
  effect: VideoAnimateEffectType[]
}

export enum EScaleMode {
  aspectFill = 'aspectFill',
  aspectFit = 'aspectFit',
  scaleFill = 'scaleFill',
}

export type VideoAnimateEffectType = {
  effectWidth: number //动态元素宽
  effectHeight: number //动态元素高
  effectId: number | string //动态元素索引id
  effectTag: string //动态元素的tag
  effectType: 'txt' | 'img' ////动态元素类型
  // 业务关联
  img?: ImageData | HTMLImageElement | ImageBitmap
  text: string
  fontColor?: string
  fontSize?: number
  scaleMode: EScaleMode
  [key: string]: any
}

export type VideoAnimateDescriptType = {
  width: number //输出视频的宽
  height: number //输出视频的高
  isEffect: number //是否为动态元素视频
  version: number //插件的版本号
  rgbFrame: number[] //rgb位置信息
  alphaFrame: number[] //alpha位置信息
  fps: number
  hasAudio?: boolean
}

export type VideoAnimateDataType = {
  frameIndex: number
  data: VideoAnimateDataItemType[]
  [key: string]: any
}

export type VideoAnimateDataItemType = {
  renderFrame: number[] //在画布上的位置
  effectId: number | string //标志是哪个动态元素
  outputFrame: number[] //在视频区域的位置
  [key: string]: any
}

export type WebglVersion = 1 | 2 | 'canvas2d'
