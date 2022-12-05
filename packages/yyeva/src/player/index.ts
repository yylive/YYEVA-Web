import Render from 'src/player/render'
import Render2D from 'src/player/render/canvas2d'
import videoEvents from 'src/player/video/videoEvents'
import {MixEvideoOptions, EventCallback, WebglVersion, EPlayError, EPlayStep, VideoAnimateType} from 'src/type/mix'
// import {prefetchVideoStream} from 'src/player/video/mse'
// import {versionTips} from 'src/helper/logger'
import Animator, {AnimatorType} from 'src/player/video/animator'
import {logger} from 'src/helper/logger'
import parser from 'src/parser'
import db from 'src/parser/db'
// import Webgl from './render/webglEntity'

import {getVIdeoId} from 'src/helper/utils'
import {polyfill, clickPlayBtn, isHevc} from 'src/helper/polyfill'
// import VideoEntity from './render/videoEntity'
import {LoopChecker} from './loopCheck'

//
export default class EVideo {
  private video: HTMLVideoElement
  private eventsFn: {[key: string]: (...args: any[]) => void} = {}
  private animator: Animator
  private blobUrl: string
  private polyfillCreateObjectURL: boolean
  private timeoutId = null
  private loopChecker!: LoopChecker
  private videoFile?: File
  private isSupportHevc = false
  //
  public onStart: EventCallback
  public onResume: EventCallback
  public onPause: EventCallback
  public onStop: EventCallback
  public onProcess: EventCallback
  public onEnd: EventCallback
  public onError: EventCallback
  //
  public isPlay = false
  public renderer: Render | Render2D
  public renderType: 'canvas2d' | 'webgl'
  public animationType: AnimatorType
  public op: MixEvideoOptions
  public fps = 0
  public version: WebglVersion
  public webglVersion: WebglVersion
  /**
   * 记录当前播放资源的 base64,当blob url播放失败时播放
   */
  constructor(op: MixEvideoOptions) {
    if (!op.container) throw new Error('container is need!')
    if (!op.videoUrl) throw new Error('videoUrl is need!')
    //TODO 考虑到 除了 htmlinputelement http 应该还有 dataUrl 后续拓展
    this.op = op
    this.loopChecker = new LoopChecker(this.op.loop)
    this.video = this.videoCreate()
    this.animator = new Animator(this.video, this.op)
    // 是否创建 object url
    this.polyfillCreateObjectURL = (polyfill.baidu || polyfill.quark || polyfill.uc) && this.op.forceBlob === false
    //
    if (this.op.renderType === 'canvas2d') {
      this.renderer = new Render2D(this.op)
      this.renderType = 'canvas2d'
    } else {
      this.renderer = new Render(this.op)
      this.renderType = 'webgl'
    }
    this.webglVersion = this.renderer.webgl.version
    //
    //实例化后但是不支持 webgl后降级
    if (this.webglVersion === 'canvas2d') {
      this.renderer = new Render2D(this.op)
      this.renderType = 'canvas2d'
    }
    // check IndexDB cache
    db.IndexDB = this.op.useVideoDBCache

    this.loopChecker.onEnd = () => {
      logger.debug('[player] onEnd...url:', this.op.videoUrl)
      this.stop()
      this.destroy()
      this.onEnd && this.onEnd()
    }
  }
  public async setup() {
    try {
      logger.debug('[=== e-video setup ===]')
      await this.videoLoad()
      await this.renderer.setup(this.video)
      //判断是否存在 audio 默认为 false
      if (!this.renderer.videoEntity.hasAudio) {
        this.video.muted = true
      } else {
        this.video.muted = typeof this.op.mute !== 'undefined' ? this.op.mute : false
      }
      // video.muted = typeof this.op.mute !== 'undefined' ? this.op.mute : !VideoEntity.hasAudio
      //
      this.fps = this.renderer.videoEntity.fps
      logger.debug(`[EVdeo] this.renderer.videoEntity.fps`, this.renderer.videoEntity.fps)
      this.animator.setVideoFps({
        fps: this.renderer.videoEntity.fps,
        videoFps: this.renderer.videoEntity.videoFps,
      })
      //
      await this.animator.setup()
      this.animator.onUpdate = frame => {
        if (this.loopChecker.updateFrame(frame)) {
          this.renderer.render(frame)
        }
      }
      this.animationType = this.animator.animationType
      //
      this.renderer.renderCache.mCache.setOptions({
        fps: this.fps,
        animationType: this.animationType,
        videoDurationTime: this.video.duration,
      })
      //
      logger.debug('[setup]', this.animationType, this.webglVersion)
      // 纯在缓存后不再显示 video标签 节省性能
      if (this.webglVersion !== 'canvas2d' && this.op.renderType !== 'canvas2d') {
        const render = this.renderer as Render
        const isCache = this.op.useFrameCache ? render.renderCache.isCache() : false
        if (
          this.animationType !== 'requestVideoFrameCallback' &&
          !this.op.showVideo &&
          // Webgl.version === 1 &&
          !isCache
        ) {
          const video = this.video
          video.style.position = 'fixed' //防止撑开页面
          video.style.opacity = '0.1'
          video.style.left = '0'
          video.style.top = '0'
          video.style.visibility = 'visible'
          video.style.width = '2px'
          video.style.height = '2px'
          video.style.pointerEvents = 'none'
          video.style.userSelect = 'none'
        }
      }
    } catch (e) {
      this.onEnd?.(e)
      this.onError?.(e)
      this.destroy()
      logger.error(e)
    }
    //
    // versionTips(this.op, this.renderType)
  }
  private setPlay = (isPlay: boolean) => {
    if (this.renderer) {
      this.renderer.isPlay = isPlay
      this.animator.isPlay = isPlay
      this.isPlay = isPlay
    }
  }
  private isDestoryed() {
    logger.debug('player is destoryed!')
  }
  public start() {
    //::TODO 做播放兼容性处理
    if (!this.renderer) return this.isDestoryed()
    this.startEvent()
  }

  private cleanTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  private beginTimer() {
    logger.debug(
      '[player]beginTimer..., duration=',
      this.video.duration,
      'loop=',
      this.loop(),
      'checkTimeout=',
      this.op.checkTimeout,
    )
    if (!this.loop() && this.op.checkTimeout && this.video.duration > 0) {
      this.cleanTimer()
      this.timeoutId = setTimeout(() => {
        logger.debug('[player] timeout...url:', this.op.videoUrl)
        this.stop()
        this.destroy()
        this.onEnd && this.onEnd()
      }, this.video.duration * 1000 + 100)
    }
  }

  private clickToPlay() {
    if (this.op.onRequestClickPlay) {
      this.op.onRequestClickPlay(this.op.container, this.video)
    } else {
      clickPlayBtn(this.op.container, this.video)
    }
  }
  private startEvent() {
    if (this.renderer.isPlay === true) return
    this.setPlay(true)
    this.animator.start()
    this.beginTimer()
    const videoPromise = this.video.play()
    // 避免 uc 夸克报错
    if (videoPromise) {
      videoPromise
        .then(() => {
          logger.debug(`${this.op.mute === false ? '声音播放' : '静音播放'}`)
        })
        .catch(e => {
          /**
           * 触发 catch 条件
           * 浏览器对静音不允许导致
           * 微信禁止自动播放导致
           * TODO 看看是否可以跟 canplaythrough 合并
           */
          /**
           * TODO 音频适配 safari
           * safari 会引起死循环
           * 暂时自动切换静音
           */
          if (polyfill.safari && polyfill.mac) {
            logger.debug('切换到静音播放', this.op.videoSource)
            this.video.muted = true
            this.video.play().catch(e => {
              logger.debug(e)
              this.op?.onError?.(e)
            })
            return
          }
          //
          logger.debug(`切换到静音播放`, this.op.videoSource, e)
          this.clickToPlay()
          // 增加弹窗 手动触发 video.play
          if (e?.code === 0 && e?.name === EPlayError.NotAllowedError) {
            this.op?.onError?.({
              playError: EPlayError.NotAllowedError,
              video: this.video,
              playStep: EPlayStep.muted,
            })
          }
        })
    } else {
      this.op?.onEnd?.()
    }
  }
  public stop() {
    if (!this.renderer) return this.isDestoryed()
    if (this.renderer.isPlay === false) return
    this.setPlay(false)
    this.animator.stop()
    this.video.pause()
    this.cleanTimer()
  }
  private videoEvent = (e: any) => {
    logger.debug(`[${e.type}]:`, e)
    this.eventsFn[e.type] && this.eventsFn[e.type]()
  }

  private loop() {
    return this.loopChecker.loopCount > 1
  }

  private videoCreate() {
    let videoID = this.op.videoID || getVIdeoId(this.op.videoSource, polyfill.weixin)
    logger.debug('[videoID]', videoID)
    const videoElm = videoID ? document.getElementById(videoID) : undefined
    let video: HTMLVideoElement
    if (videoElm instanceof HTMLVideoElement) {
      video = videoElm
    } else {
      video = document.createElement('video')
      // 插入video 解决IOS不播放问题
      document.body.appendChild(video)
    }
    // ========== heck hevc ==============
    const op = this.op
    this.isSupportHevc = isHevc(video)
    if (this.isSupportHevc && op.hevcUrl) {
      op.videoUrl = op.hevcUrl
      this.op.isHevc = true
    }
    if (op.videoUrl instanceof File) {
      op.useVideoDBCache = false
      this.videoFile = op.videoUrl
      this.op.videoSource = this.videoFile.name
    } else {
      this.op.videoSource = op.videoUrl
    }
    //重置 videoID
    if (!videoID) {
      videoID = getVIdeoId(this.op.videoSource, polyfill.weixin)
      video.setAttribute('id', videoID)
    }
    // ========== ============================
    if (!this.op.showVideo) {
      video.style.position = 'fixed' //防止撑开页面
      video.style.opacity = '0'
      video.style.left = '-9999px'
      video.style.top = '9999px'
      video.style.visibility = 'hidden'
    }
    //
    // video.crossOrigin = 'crossOrigin'
    /**
     * metadata 当页面加载后只载入元数据
     * auto 当页面加载后载入整个视频
     * none 当页面加载后不载入视频
     */

    //
    // video.muted = typeof this.op.mute !== 'undefined' ? this.op.mute : true
    video.loop = this.loop()
    video.crossOrigin = 'anonymous'
    video.autoplay = true
    // video.preload = 'metadata'
    video.setAttribute('preload', 'auto') // 这个视频优先加载
    // 标志视频将被“inline”播放，即在元素的播放区域内。
    video.setAttribute('x5-playsinline', 'true')
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('x-webkit-airplay', 'allow') //用于禁用使用有线连接的设备(HDMI、DVI等)的远程播放功能。

    // 启用同层H5播放器，就是在视频全屏的时候，div可以呈现在视频层上，也是WeChat安卓版特有的属性。同层播放别名也叫做沉浸式播放
    video.setAttribute('t7-video-player-type', 'h5')
    video.setAttribute('x5-video-player-type', 'h5')
    // UC 内联播放
    if (polyfill.quark || polyfill.uc) video.setAttribute('renderer', 'standard')
    return video
  }
  private async videoAddEvents() {
    const video = this.video
    // register events
    this.eventsFn.canplaythrough = () => {
      logger.debug('canplaythrough paused', video.paused)
      if (video.paused) {
        const videoPromise = video.play()
        if (videoPromise)
          videoPromise.catch(e => {
            logger.warn(`play() error canplaythrough to play`, e.code, e.message, e.name)
            if (e?.code === 0 && e?.name === EPlayError.NotAllowedError) {
              this.op?.onError?.({
                playError: EPlayError.NotAllowedError,
                video: this.video,
                playStep: EPlayStep.canplaythrough,
              })
            }
          })
      }
    }
    this.eventsFn.stalled = () => {
      this.video.load()
      // this.start()
    }
    this.eventsFn.playing = () => {
      // this.setPlay(true)
      //
      this.start()
      this.onStart && this.onStart()
    }
    this.eventsFn.pause = () => {
      this.stop()
      this.onPause && this.onPause()
    }
    this.eventsFn.resume = () => {
      this.start()
      this.onResume && this.onResume()
    }
    this.eventsFn.ended = () => {
      this.destroy()
      this.onEnd && this.onEnd()
    }
    this.eventsFn.progress = () => {
      this.onProcess && this.onProcess()
    }
    this.eventsFn.stop = () => {
      this.onStop && this.onStop()
    }
    //循环播放的时候触发
    this.eventsFn.seeked = () => {
      // logger.debug('=== [seeked] === 重新播放')
      this.renderer.videoSeekedEvent()
    }
    this.eventsFn.error = e => {
      this.onError && this.onError(e)
    }
    videoEvents.map(name => {
      video.addEventListener(name, this.videoEvent, false)
    })
    // 防止 Safari 暂停 后无法播放
    document.addEventListener('visibilitychange', this.videoVisbility, false)
    //
    //
    // if (this.op.showVideo) document.body.appendChild(video)
    // onready
    return new Promise(resolve => {
      // IOS 微信会卡住在这里 不能注销 video
      video.addEventListener('loadedmetadata', e => {
        this.videoEvent(e)
        resolve(e)
        logger.debug('[video loadedmetadata]', video.videoWidth, video.videoHeight, video.src.length)
      })
    })
  }
  private async videoLoad() {
    const video = this.video
    if (this.op.usePrefetch) {
      const url = await this.prefetch()
      video.src = url
      logger.debug('[prefetch url]', url)
    } else {
      video.src = this.op.videoSource
      logger.debug('[prefetch url]', this.op.videoSource)
    }
    video.load()
    logger.debug('[video load]')
    await this.videoAddEvents()
  }
  /**
   * 页面隐藏时执行
   */
  private videoVisbility = () => {
    logger.debug('[visibilitychange]', document.hidden)
    if (document.hidden) {
      logger.debug('[visibilitychange] pause')
      this.video.pause()
    } else {
      logger.debug('[visibilitychange] play')
      this.video.play()
    }
  }
  private removeVideoEvent() {
    //清除监听事件
    videoEvents.map(name => {
      this.video.removeEventListener(name, this.videoEvent, false)
    })
    //
    document.removeEventListener('visibilitychange', this.videoVisbility, false)
    //
    if (this.video) {
      this.video.pause()
      if (!polyfill.weixin && !this.op.videoID) {
        this.video.src = ''
        this.video.load()
        this.video.remove()
      }
    }
  }
  private revokeObjectURL(tips: string) {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl)
      logger.debug(`[${tips} revokeObjectURL]`, this.blobUrl.length)
      this.blobUrl = undefined as any
    }
  }
  private createObjectURL(blob: Blob | MediaSource): any {
    logger.debug('[createObjectURL]')
    return URL.createObjectURL(blob)
  }
  public destroy() {
    if (!this.renderer) return this.isDestoryed()
    this.revokeObjectURL('destroy')
    logger.debug('[destroy]')
    // this.stop()
    this.setPlay(false)
    this.removeVideoEvent()
    this.renderer.destroy()
    this.animator.destroy()
    //
    this.renderer = undefined as any
    this.animator = undefined as any
    this.version = undefined as any
    // 释放 file 文件
    this.videoFile = undefined
    this.cleanTimer()
  }
  private async checkVideoCache(): Promise<string | undefined> {
    try {
      const d = await db.model().find(this.op.videoSource)
      if (d) {
        const {blob, data} = d
        if (data) this.renderer.videoEntity.setConfig(data)
        logger.debug('[checkVideoCache]')
        this.blobUrl = this.createObjectURL(blob)
        return this.blobUrl
      }
    } catch (e) {
      logger.error(e)
    }
    return undefined
  }
  async prefetch(): Promise<string> {
    // const URL = (window as any).webkitURL || window.URL
    // const polyfillCreateObjectURL = polyfill.baidu || ((polyfill.quark || polyfill.uc) && polyfill.android)
    //
    // const polyfillCreateObjectURL = (polyfill.baidu || polyfill.quark || polyfill.uc) && this.op.forceBlob === false
    //
    if (this.op.useVideoDBCache && !this.polyfillCreateObjectURL) {
      const url = await this.checkVideoCache()
      if (url) return url
    }
    //
    let file
    if (!this.videoFile) {
      file = await this.getVideoByHttp()
    } else {
      file = this.videoFile
    }
    const url = await this.readFileToBlobUrl(file)
    logger.debug('[prefetch result]', url, `this.op.useVideoDBCache`, this.op.useVideoDBCache)
    return url
  }
  private readFileToBlobUrl(file): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)
      fileReader.onloadend = () => {
        let rs = fileReader.result as string
        let raw = atob(rs.slice(rs.indexOf(',') + 1)) //获取视频信息
        /**
         * 判断 videoUrl 资源 是否为 H.265
         */
        const codecRegex = new RegExp('H.265/HEVC')
        const isHevc = codecRegex.test(raw)
        if (isHevc) {
          this.op.isHevc = true
        }
        /**
         * 根据 useMetaData 获取 yy视频 metadata 信息
         */
        let data: VideoAnimateType
        if (this.op.useMetaData) {
          data = parser.getdata(raw)
          if (data) {
            this.renderer.videoEntity.setConfig(data)
          }
        }
        //
        if (!this.polyfillCreateObjectURL) {
          const buf = Array(raw.length)
          for (let d = 0; d < raw.length; d++) {
            buf[d] = raw.charCodeAt(d)
          }
          const arr = new Uint8Array(buf)
          const blob = new Blob([arr], {type: 'video/mp4'})
          // 返回 metadata 数据
          if (this.op.useVideoDBCache) {
            db.model().insert(this.op.videoSource, {blob, data})
          }
          this.blobUrl = this.createObjectURL(blob)
          resolve(this.blobUrl)
        } else {
          //获取 data 后 原路返回
          resolve(this.op.videoSource)
        }
        // gc
        rs = undefined
        raw = undefined
      }
    })
  }
  private getVideoByHttp() {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', this.op.videoSource, true)
      xhr.responseType = 'blob'
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 304) {
          resolve(xhr.response)
        } else {
          reject(new Error('http response invalid' + xhr.status))
        }
      }
      xhr.send()
    })
  }
}
