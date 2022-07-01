import Render from 'src/player/render'
import Render2D from 'src/player/render/canvas2d'
import videoEvents from 'src/player/video/videoEvents'
import {MixEvideoOptions, EventCallback, WebglVersion, EPlayError, EPlayStep} from 'src/type/mix'
// import {prefetchVideoStream} from 'src/player/video/mse'
// import {versionTips} from 'src/helper/logger'
import Animator from 'src/player/video/animator'
import {logger} from 'src/helper/logger'
import parser from 'src/parser'
import db from 'src/parser/db'
import Webgl from './render/webglEntity'

import {getVIdeoId} from 'src/helper/utils'
import {polyfill, wxAndroidClick} from 'src/helper/polyfill'
// import VideoEntity from './render/videoEntity'
//
export default class EVideo {
  public op: MixEvideoOptions
  private video: HTMLVideoElement
  public renderer: Render | Render2D
  public renderType: 'canvas2d' | 'webgl'
  public version: WebglVersion
  private eventsFn: {[key: string]: (...args: any[]) => void} = {}
  private animator: Animator
  private blobUrl: string
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
  /**
   * 记录当前播放资源的 base64,当blob url播放失败时播放
   */
  constructor(op: MixEvideoOptions) {
    if (!op.container) throw new Error('container is need!')
    if (!op.videoUrl) throw new Error('videoUrl is need!')
    this.op = op
    this.video = this.videoCreate()
    this.animator = new Animator(this.video, this.op)
    //
    if (this.op.renderType === 'canvas2d') {
      this.renderer = new Render2D(this.op)
      this.renderType = 'canvas2d'
    } else {
      this.renderer = new Render(this.op)
      this.renderType = 'webgl'
    }
    //实例化后但是不支持 webgl后降级
    if (Webgl.version === 'canvas2d') {
      this.renderer = new Render2D(this.op)
      this.renderType = 'canvas2d'
    }
    // check IndexDB cache
    db.IndexDB = this.op.useVideoDBCache
  }
  public async setup() {
    try {
      logger.debug('[=== e-video setup ===]')
      await this.videoLoad()
      await this.renderer.setup(this.video)
      // this.animator.setVideoFps(VideoEntity.fps)
      await this.animator.setup()
      this.animator.onUpdate = frame => {
        this.renderer.render(frame)
      }
      //
      logger.debug('[setup]', Animator.animationType, Webgl.version)
      // 纯在缓存后不再显示 video标签 节省性能
      if (Webgl.version !== 'canvas2d' && this.op.renderType !== 'canvas2d') {
        const render = this.renderer as Render
        const isCache = this.op.useFrameCache ? render.renderCache.isCache() : false
        if (
          Animator.animationType !== 'requestVideoFrameCallback' &&
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
      this.onEnd?.()
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
  private startEvent() {
    if (this.renderer.isPlay === true) return
    this.setPlay(true)
    this.animator.start()
    const videoPromise = this.video.play()
    // console.log(`### videoPromise`, videoPromise)
    // 避免 uc 夸克报错
    if (videoPromise) {
      videoPromise
        .then(() => {
          logger.debug(`${this.op.mute === false ? '声音播放' : '静音播放'}`)
        })
        .catch(err => {
          logger.warn('切换到静音播放', this.op.videoUrl)
          this.video.muted = true
          this.video.play().catch(e => {
            logger.warn(`play() error toggle muted to play`, e.code, e.message, e.name)
            if (this.op.onRequestClickPlay) {
              this.op.onRequestClickPlay(this.video)
            } else {
              wxAndroidClick(this.op.container, this.video)
            }
            // 增加弹窗 手动触发 video.play
            if (e?.code === 0 && e?.name === EPlayError.NotAllowedError) {
              this.op?.onError?.({
                playError: EPlayError.NotAllowedError,
                video: this.video,
                playStep: EPlayStep.muted,
              })
            }
          })
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
  }
  private videoEvent = (e: any) => {
    logger.debug(`[${e.type}]:`, e)
    this.eventsFn[e.type] && this.eventsFn[e.type]()
  }
  private videoCreate() {
    const videoID = this.op.videoID || getVIdeoId(this.op.videoUrl, polyfill.weixin)
    logger.debug('[videoID]', videoID)
    const videoElm = document.getElementById(videoID)
    let video: HTMLVideoElement
    if (videoElm instanceof HTMLVideoElement) {
      video = videoElm
    } else {
      video = document.createElement('video')
      video.setAttribute('id', videoID)
      // 插入video 解决IOS不播放问题
      document.body.appendChild(video)
    }
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
    video.muted = typeof this.op.mute !== 'undefined' ? this.op.mute : true
    video.loop = typeof this.op.loop !== 'undefined' ? this.op.loop : true
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
      logger.debug('[prefetch url]', url.length)
    } else {
      video.src = this.op.videoUrl
      logger.debug('[prefetch url]', this.op.videoUrl.length)
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
  }
  private async checkVideoCache(): Promise<string | undefined> {
    try {
      const d = await db.model().find(this.op.videoUrl)
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
    const polyfillCreateObjectURL = (polyfill.baidu || polyfill.quark || polyfill.uc) && this.op.forceBlob === false
    //
    if (this.op.useVideoDBCache && !polyfillCreateObjectURL) {
      const url = await this.checkVideoCache()
      if (url) return url
    }
    //
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', this.op.videoUrl, true)
      xhr.responseType = 'blob'
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 304) {
          const fileReader = new FileReader()
          fileReader.onloadend = () => {
            const rs = fileReader.result as string
            /**
             * 根据 useMetaData 获取 yy视频 metadata 信息
             */
            let data
            if (this.op.useMetaData) {
              data = parser.getdata(rs)
              if (data) {
                this.renderer.videoEntity.setConfig(data)
              }
            }
            //
            if (!polyfillCreateObjectURL) {
              const raw = atob(rs.slice(rs.indexOf(',') + 1))
              const buf = Array(raw.length)
              for (let d = 0; d < raw.length; d++) {
                buf[d] = raw.charCodeAt(d)
              }
              const arr = new Uint8Array(buf)
              const blob = new Blob([arr], {type: 'video/mp4'})
              // 返回 metadata 数据
              if (this.op.useVideoDBCache) {
                db.model().insert(this.op.videoUrl, {blob, data})
              }
              this.blobUrl = this.createObjectURL(blob)
              resolve(this.blobUrl)
            } else {
              //获取 data 后 原路返回
              resolve(this.op.videoUrl)
            }
          }
          fileReader.readAsDataURL(xhr.response)
        } else {
          reject(new Error('http response invalid' + xhr.status))
        }
      }
      xhr.send()
    })
  }
}
