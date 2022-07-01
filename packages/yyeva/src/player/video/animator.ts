import {logger} from 'src/helper/logger'
import {MetaDataType, MixEvideoOptions} from 'src/type/mix'
import VideoEntity from 'src/player/render/videoEntity'
//
type reqType = 'requestVideoFrameCallback' | 'requestAnimationFrame' | 'setTimeout'

export default class Animator {
  private animateId: any
  static animationType: reqType
  private video: HTMLVideoElement
  // public fps = 20
  // private videoFps = 0
  private frameDelay = 0
  private frameStartTime = 0
  private op: MixEvideoOptions
  //
  public isPlay: boolean
  public requestAnim: (...args: any[]) => void
  public cancelAnim: (...args: any[]) => void
  //
  public onUpdate?: (frame: number) => void
  //
  constructor(video: HTMLVideoElement, op: MixEvideoOptions) {
    this.video = video
    this.op = op
    this.isPlay = false

    if ('requestVideoFrameCallback' in HTMLVideoElement.prototype && this.op.useAccurate) {
      Animator.animationType = 'requestVideoFrameCallback'
    } else if (typeof requestAnimationFrame !== 'undefined') {
      Animator.animationType = 'requestAnimationFrame'
    } else {
      Animator.animationType = 'setTimeout'
    }
    //
    // if (this.op.fps) {
    //   this.fps = this.op.fps
    // }
    //
    this.requestAnim = this.returnRequestAnim()
    this.cancelAnim = this.returnCancelAnim()
  }
  // public setVideoFps(videoFps?: number) {
  //   if (videoFps && videoFps > 0) {
  //     if (!this.op.fps) this.fps = videoFps
  //     this.videoFps = videoFps
  //   }
  //   this.frameDelay = 1000 / this.fps
  // }
  public async setup() {
    this.frameDelay = 1000 / VideoEntity.fps
  }
  private currentTimeMillsecond: () => number = () => {
    if (typeof performance === 'undefined') {
      return new Date().getTime()
    }
    return performance.now()
  }
  start() {
    if (this.frameDelay === 0 && VideoEntity.fps > 0) this.frameDelay = 1000 / VideoEntity.fps
    logger.debug('animator start', this.animateId, this.frameDelay, VideoEntity.fps)
    this.frameStartTime = this.currentTimeMillsecond()
    this.cancelAnim()
    this.requestAnim(this.drawFrame)
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
  }
  drawFrame = (now = this.currentTimeMillsecond(), metadata?: MetaDataType) => {
    if (!this.isPlay) return
    this.cancelAnim()
    this.requestAnim(this.drawFrame)
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
    return Math.round(mediaTime * VideoEntity.VideoFps) + (this.op.offset || 0)
  }
  returnRequestAnim() {
    switch (Animator.animationType) {
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
            if (this.requestAnim) this.animateId = this.requestAnim(fn)
          })
        }
      default:
        return (fn: () => void) => (this.animateId = setTimeout(fn, 1000 / VideoEntity.fps))
    }
  }
  returnCancelAnim() {
    switch (Animator.animationType) {
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
