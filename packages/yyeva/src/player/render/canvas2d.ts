import {MixEvideoOptions, ResizeCanvasType} from 'src/type/mix'
import VideoEntity from 'src/player/render/videoEntity'
import RenderCache from './renderCache'
import {logger} from 'src/helper/logger'
import {isOffscreenCanvasSupported} from 'src/helper/utils'
//
export default class Render2D {
  public isPlay = false
  public webgl: any = {version: 'canvas2d'}
  public videoEntity: VideoEntity
  public renderCache: RenderCache
  //
  private video: HTMLVideoElement | undefined
  private ofs: HTMLCanvasElement | OffscreenCanvas
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  //
  private canvas?: HTMLCanvasElement
  private context: CanvasRenderingContext2D | null | undefined
  private op: MixEvideoOptions
  // private frameCache: any = {}
  //
  private alphaCanvas = document.createElement('canvas')
  private alphaCtx: CanvasRenderingContext2D
  constructor(op: MixEvideoOptions) {
    logger.debug('[Render In Canvas]')
    this.op = op
    //
    this.ofs =
      isOffscreenCanvasSupported() && !!self.createImageBitmap
        ? new OffscreenCanvas(300, 300)
        : document.createElement('canvas')
    //
    this.ctx = this.ofs.getContext('2d')
    //
    this.renderCache = new RenderCache(this.ofs, this.op)
    this.videoEntity = new VideoEntity(op)
    //
    this.alphaCtx = this.alphaCanvas.getContext('2d')
  }
  private setSizeCanvas(canvas: HTMLCanvasElement, resizeCanvas: ResizeCanvasType) {
    switch (resizeCanvas) {
      case 'percent':
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        break
      case 'percentH':
        canvas.style.height = '100%'
        break
      case 'percentW':
        canvas.style.width = '100%'
        break
      default:
        break
    }
  }
  // setPlay(isPlayer: boolean) {
  //   this.isPlay = isPlayer
  // }
  public videoSeekedEvent() {
    logger.debug('[canvas2d][videoSeekedEvent]')
    return this.renderCache.mCache.videoSeekedEvent()
  }
  async setup(video?: HTMLVideoElement) {
    if (!video) throw new Error('video must support!')
    //
    await this.renderCache.setup()
    //
    this.video = video
    await this.videoEntity.setup()
    const canvas = document.createElement('canvas')
    this.op.container.appendChild(canvas)
    canvas.width = video.videoWidth / 2
    canvas.height = video.videoHeight
    this.context = canvas.getContext('2d')
    this.canvas = canvas
    //
    this.ofs.width = video.videoWidth
    this.ofs.height = video.videoHeight
    //
    const descript = this.videoEntity.config?.descript
    if (descript) {
      const [x, y, w, h] = descript.rgbFrame
      canvas.width = w
      canvas.height = h
      this.ofs.width = descript.width
      this.ofs.height = descript.height
    }
    this.setSizeCanvas(canvas, this.op.resizeCanvas)
  }
  destroy() {
    this.clear()
    this.videoEntity.destroy()
    if (this.canvas) {
      this.canvas.remove()
      delete this.canvas
      this.canvas = null
    }
    if (this.ofs) {
      if (this.ofs instanceof HTMLCanvasElement) {
        this.ofs.remove()
      } else {
        this.ofs = undefined as any
      }
    }
    if (this.alphaCanvas) {
      this.alphaCanvas.remove()
    }
  }
  clear() {
    if (typeof this.video !== 'undefined' && this.context)
      this.context.clearRect(0, 0, this.video?.videoWidth, this.video?.videoHeight)
  }
  render(frame = 0) {
    const {width: w, height: h} = this.canvas
    //
    if (this.op.useFrameCache) {
      const frameItem = this.renderCache.getCache(frame)
      // window.console.log('[canvas2d frameItem]', frame, frameItem)
      if (frameItem === 'skip') return
      if (frameItem) {
        this.context.clearRect(0, 0, w, h)
        this.context.drawImage(frameItem, 0, 0, w, h, 0, 0, w, h)
        return
      }
    }
    const descript = this.videoEntity.config?.descript
    if (descript) {
      this.renderMix(frame)
    } else {
      this.renderLR(frame)
    }
    this.context.clearRect(0, 0, w, h)
    this.context.drawImage(this.ofs, 0, 0, w, h, 0, 0, w, h)
    // this.createFramesCache(frame)
    if (this.op.useFrameCache) {
      this.renderCache.setCache(frame)
    }
  }
  scaleImageData(imageData, scale) {
    const ctx = this.alphaCtx
    const scaled = ctx.createImageData(imageData.width * scale, imageData.height * scale)
    const subLine = ctx.createImageData(scale, 1).data
    for (let row = 0; row < imageData.height; row++) {
      for (let col = 0; col < imageData.width; col++) {
        const sourcePixel = imageData.data.subarray(
          (row * imageData.width + col) * 4,
          (row * imageData.width + col) * 4 + 4,
        )
        for (let x = 0; x < scale; x++) subLine.set(sourcePixel, x * 4)
        for (let y = 0; y < scale; y++) {
          const destRow = row * scale + y
          const destCol = col * scale
          scaled.data.set(subLine, (destRow * scaled.width + destCol) * 4)
        }
      }
    }

    return scaled
  }
  renderMix(frame = 0) {
    const descript = this.videoEntity.config?.descript
    if (!this.ctx || !this.isPlay || typeof this.video === 'undefined' || !descript) return
    // window.console.log(info)
    const [x, y, w, h] = descript.rgbFrame
    const [ax, ay, aw, ah] = descript.alphaFrame
    //
    // window.console.log(' descript.alphaFrame', descript.alphaFrame)
    const vw = this.video.videoWidth
    const vh = this.video.videoHeight
    this.ctx.drawImage(this.video, 0, 0, vw, vh, 0, 0, vw, vh)
    const colorImageData = this.ctx.getImageData(x, y, w, h)
    let alpathImageData = this.ctx.getImageData(ax, ay, aw, ah)
    alpathImageData = this.scaleImageData(alpathImageData, w / aw)
    // alpathImageData.width = w
    // alpathImageData.height = h
    // window.console.log(colorImageData, alpathImageData)
    for (let i = 3, len = colorImageData?.data.length; i < len; i += 4) {
      colorImageData.data[i] = alpathImageData.data[i - 1]
    }
    this.ctx.clearRect(0, 0, w, h)
    this.ctx.putImageData(colorImageData, 0, 0, 0, 0, w, h)
    // this.ctx.putImageData(alpathImageData, 0, 0, 0, 0, w, h)
  }
  renderLR(frame = 0) {
    if (!this.ctx || !this.isPlay || typeof this.video === 'undefined') return
    const vw = this.video.videoWidth
    const vh = this.video.videoHeight
    const stageWidth = vw / 2
    const stageHeight = vh
    this.ctx.drawImage(this.video, 0, 0, vw, vh, 0, 0, vw, vh)
    if (this.op.alphaDirection === 'left') {
      const colorImageData = this.ctx.getImageData(stageWidth, 0, stageWidth, stageHeight)
      const alpathImageData = this.ctx.getImageData(0, 0, stageWidth, stageHeight)
      for (let i = 3, len = colorImageData?.data.length; i < len; i += 4) {
        colorImageData.data[i] = alpathImageData.data[i - 1]
      }
      this.ctx.putImageData(colorImageData, 0, 0, 0, 0, stageWidth, stageHeight)
    } else {
      const alpathImageData = this.ctx.getImageData(stageWidth, 0, stageWidth, stageHeight)
      const colorImageData = this.ctx.getImageData(0, 0, stageWidth, stageHeight)
      for (let i = 3, len = colorImageData?.data.length; i < len; i += 4) {
        colorImageData.data[i] = alpathImageData.data[i - 1]
      }
      this.ctx.putImageData(colorImageData, 0, 0, 0, 0, stageWidth, stageHeight)
    }
  }
}
