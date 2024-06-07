import {logger} from 'src/helper/logger'
import {RenderWebGPUBase} from './base'
export default class RenderWebGPU extends RenderWebGPUBase {
  public videoSeekedEvent() {
    // return this.renderCache.mCache.videoSeekedEvent()
  }
  public async setup(video?: HTMLVideoElement) {
    if (!video) throw new Error('video must support!')
    await this.renderCache.setup()
    await this.videoEntity.setup()
    this.video = video
    this.resizeCanvasToDisplaySize()
    //
    await this.initGPUContext()
  }

  public render(frame = 0) {
    if (!this.isPlay || !this.video || this.currentFrame === frame) return
    this.currentFrame = frame
    // console.log(frame)
    this.createRender()
  }
}
