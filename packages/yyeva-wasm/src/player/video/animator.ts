import {logger} from 'src/helper/logger'
import {MetaDataType, MixEvideoOptions} from 'src/type/mix'
// import VideoEntity from 'src/player/render/videoEntity'
//
export type AnimatorType = 'requestVideoFrameCallback' | 'requestAnimationFrame' | 'setTimeout'

export default class Animator {
  private animateId: number
  public animationType: AnimatorType
  private video: HTMLVideoElement
  private fps = 20
  private videoFps = 0
  private frameDelay = 0
  private frameStartTime = 0
  private op: MixEvideoOptions
  //
  public isPlay: boolean
  public requestAnim: (...args: any[]) => number
  public cancelAnim: (...args: any[]) => void
  //
  public onUpdate?: (frame: number) => void
  //
  constructor(video: HTMLVideoElement, op: MixEvideoOptions) {
    this.video = video
    this.op = op
    this.isPlay = false

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && this.op.useAccurate) {
      this.animationType = 'requestVideoFrameCallback'
    } else if (typeof requestAnimationFrame !== 'undefined') {
      this.animationType = 'requestAnimationFrame'
    } else {
      this.animationType = 'setTimeout'
    }
    //
    // if (this.op.fps) {
    //   this.fps = this.op.fps
    // }
    //
    this.requestAnim = this.returnRequestAnim()
    this.cancelAnim = this.returnCancelAnim()
  }
  public setVideoFps({videoFps, fps}: any) {
    this.fps = fps
    this.videoFps = videoFps
    if (this.animationType !== 'requestVideoFrameCallback' && this.fps > 20) {
      this.fps = 20
    }
  }
  public async setup() {
    this.frameDelay = 1000 / this.fps
  }
  private currentTimeMillsecond: () => number = () => {
    if (typeof performance === 'undefined') {
      return new Date().getTime()
    }
    return performance.now()
  }
  start() {
    if (this.frameDelay === 0 && this.fps > 0) this.frameDelay = 1000 / this.fps
    logger.debug('animator start', this.animateId, this.frameDelay, this.fps)
    this.frameStartTime = this.currentTimeMillsecond()
    this.cancelAnim()
    this.animateId = this.requestAnim(this.drawFrame)
  }
  stop() {
    logger.debug('animator stop', this.animateId)
    this.cancelAnim()
  }

  destroy() {
    logger.debug('[animator destroy]', this.animateId)
    this.cancelAnim()
    this.op = undefined as any
    this.video = undefined as any
    this.cancelAnim = undefined as any
    this.requestAnim = undefined as any
    this.onUpdate = undefined
    this.drawFrame = undefined
  }
  drawFrame = (now = this.currentTimeMillsecond(), metadata?: MetaDataType) => {
    if (!this.isPlay) return
    this.cancelAnim()
    this.animateId = this.requestAnim(this.drawFrame)
    // if (!this.op.fps) {
    const mediaTime = metadata?.mediaTime || this.video.currentTime
    const frame = this.getCurrentFrame(mediaTime)
    this.onUpdate && this.onUpdate(frame)
    /*
    } else {
      let mediaTime = metadata?.mediaTime || this.video.currentTime
      const delta = now - this.frameStartTime
      if (delta > this.frameDelay) {
        mediaTime = mediaTime - delta / 1000
        const frame = this.getCurrentFrame(mediaTime)
        this.onUpdate && this.onUpdate(frame)
        this.frameStartTime = now - (delta % this.frameDelay)
      }
    }
    */
  }
  getCurrentFrame(mediaTime = 0) {
    // const videoFps = this.videoFps || this.fps
    return Math.round(mediaTime * this.videoFps) + (this.op.offset || 0)
  }
  returnRequestAnim() {
    switch (this.animationType) {
      case 'requestVideoFrameCallback':
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        return fn => (this.animateId = this.video.requestVideoFrameCallback(fn))
      case 'requestAnimationFrame':
        // return (fn: FrameRequestCallback) => (this.animateId = requestAnimationFrame(fn))
        return fn => {
          return requestAnimationFrame(() => {
            const now = this.currentTimeMillsecond()
            const delta = now - this.frameStartTime
            if (delta > this.frameDelay) {
              this.frameStartTime = now - (delta % this.frameDelay)
              return fn()
            }
            if (this.requestAnim) {
              if(this.animateId) {
                this.cancelAnim()
              }
              this.animateId = this.requestAnim(fn)
            } 
          })
        }
      default:
        return (fn: () => void) => (this.animateId = window.setTimeout(fn, 1000 / this.fps))
    }
  }
  returnCancelAnim() {
    switch (this.animationType) {
      case 'requestVideoFrameCallback':
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        return () => this.animateId && this.video.cancelVideoFrameCallback(this.animateId)
      case 'requestAnimationFrame':
        return () => this.animateId && cancelAnimationFrame(this.animateId)
      default:
        return () => this.animateId && clearTimeout(this.animateId)
    }
  }
}
