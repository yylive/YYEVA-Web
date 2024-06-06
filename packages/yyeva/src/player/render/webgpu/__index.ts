import {logger} from 'src/helper/logger'
import type RenderCache from 'src/player/render/common/renderCache'
import type VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType, VideoAnimateDataItemType} from 'src/type/mix'

export default class RenderWebGPU {
  public isPlay = false
  public videoEntity: VideoEntity
  public renderCache: RenderCache
  public isSupport = !!navigator.gpu
  public renderType = 'webgpu'
  private op!: MixEvideoOptions
  //   private currentFrame = -1 //过滤重复帧
  //   drawEffect: {[key: string]: any}
  constructor(op: MixEvideoOptions) {
    logger.debug('[Render In WebGPU]')
    this.op = op
    // this.drawEffect = {}
  }
  public destroy() {
    // this.webgl.destroy()
    this.videoEntity.destroy()
    this.renderCache.destroy()
  }
  async setup(video?: HTMLVideoElement) {}
  render(frame = 0) {
    console.log(frame)
    // this.currentFrame = frame
  }
  public videoSeekedEvent() {
    // return this.renderCache.mCache.videoSeekedEvent()
  }
}
