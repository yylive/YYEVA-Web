import {logger} from 'src/helper/logger'
import {isOffscreenCanvasSupported} from 'src/helper/utils'
import RenderCache from 'src/player/render/common/renderCache'
import VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType, VideoAnimateDataItemType, WebglVersion} from 'src/type/mix'
export default class WglRender {
  public isPlay = false
  public videoEntity: VideoEntity
  public renderType = 'webgl'
  public renderCache: RenderCache
  public PER_SIZE = 9
  public canvas?: HTMLCanvasElement //显示画布
  public ctx?: CanvasRenderingContext2D
  public ofs: HTMLCanvasElement | OffscreenCanvas
  public version: WebglVersion
  public gpu!: GPUCanvasContext
  //
  // private dpr = 1
  private op: MixEvideoOptions
  private textureMap: any = {}
  private imagePos: any
  private currentFrame = -1 //过滤重复帧
  private video: HTMLVideoElement | undefined
  private program: WebGLProgram | undefined
  constructor(op: MixEvideoOptions) {
    logger.debug('[Render In WEBGPU]')
    this.op = op
    this.createCanvas(op)
    this.renderCache = new RenderCache(this.ofs, this.op)
    this.videoEntity = new VideoEntity(op)
  }
  public videoSeekedEvent() {
    return this.renderCache.mCache.videoSeekedEvent()
  }
  public async setup(video?: HTMLVideoElement) {
    if (!video) throw new Error('video must support!')

    await this.renderCache.setup()
    await this.videoEntity.setup()
  }

  public destroy() {}

  public render(frame = 0) {
    // console.log('[render]', frame, this.op.useFrameCache)
    if (!this.isPlay || !this.video || !this.program || this.currentFrame === frame) return

    this.currentFrame = frame
  }

  createCanvas(op: MixEvideoOptions) {
    if (op.useOfsRender) {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
      op.container.appendChild(this.canvas)
      if (op.resizeCanvas) {
        this.setSizeCanvas(this.canvas, op.resizeCanvas)
      }
      this.ofs =
        isOffscreenCanvasSupported() && !!self.createImageBitmap && op.useBitmap
          ? new OffscreenCanvas(300, 300)
          : document.createElement('canvas')
    } else {
      this.ofs = document.createElement('canvas')
      if (op.resizeCanvas) {
        this.setSizeCanvas(this.ofs, op.resizeCanvas)
      }
      op.container.appendChild(this.ofs)
    }
    this.gpu = this.canvas.getContext('webgpu') as GPUCanvasContext
    this.op = op
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
}
