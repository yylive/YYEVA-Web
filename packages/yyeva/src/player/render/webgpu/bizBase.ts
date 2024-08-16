import logger from 'src/helper/logger'
import RenderCache from 'src/player/render/common/renderCache'
import VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType} from 'src/type/mix'
export class BizBase {
  public isPlay = false
  public videoEntity: VideoEntity
  public renderType = 'webgpu'
  public renderCache: RenderCache

  public version = 0
  public op: MixEvideoOptions
  public currentFrame = -1 //过滤重复帧
  public video: HTMLVideoElement | undefined
  //
  public ofs!: HTMLCanvasElement
  public ctx!: GPUCanvasContext
  constructor(op: MixEvideoOptions) {
    logger.debug('[Render In Webgl]')
    this.op = op
    this.createCanvas(op)
    this.renderCache = new RenderCache(this.ofs, this.op)
    this.videoEntity = new VideoEntity(op)
  }
  public destroy() {
    this.videoEntity.destroy()
    this.renderCache.destroy()
    this.ofs.remove()
  }
  public createCanvas(op: MixEvideoOptions) {
    this.ofs = document.createElement('canvas')
    if (op.resizeCanvas) {
      this.setSizeCanvas(this.ofs, op.resizeCanvas)
    }
    op.container.appendChild(this.ofs)
  }
  public get verriceArray() {
    const {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH} = this.getRgbaPos()
    const rgbCoord = this.computeCoord(rgbX, rgbY, rgbW, rgbH, vW, vH)
    const aCoord = this.computeCoord(aX, aY, aW, aH, vW, vH)
    // biome-ignore format:
    const vertexData = new Float32Array(
      [
        -1, 1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3],
        1, 1, rgbCoord[1], rgbCoord[3], aCoord[1], aCoord[3],
        -1, -1, rgbCoord[0], rgbCoord[2], aCoord[0], aCoord[2],
        1, -1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]
    ],
    )
    // flipY
    for (let i = 0; i < vertexData.length; i += 6) {
      // vertexData[i + 3] = rgbCoord[3] - vertexData[i + 3]
      vertexData[i + 5] = aCoord[3] - vertexData[i + 5]
    }
    return vertexData
  }
  public getRgbaPos() {
    const descript = this.videoEntity.config?.descript
    if (descript) {
      //=================== 创建缓冲区
      const {width: vW, height: vH} = descript
      const [rgbX, rgbY, rgbW, rgbH] = descript.rgbFrame
      let [aX, aY, aW, aH] = descript.alphaFrame
      // 正向渲染的兼容算法
      aY = vH - aH
      return {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH}
    } else if (this.video) {
      //默认为左右均分
      const vW = this.video.videoWidth ? this.video.videoWidth : 1800
      const vH = this.video.videoHeight ? this.video.videoHeight : 1000
      const stageW = vW / 2
      const [rgbX, rgbY, rgbW, rgbH] = this.op.alphaDirection === 'right' ? [0, 0, stageW, vH] : [stageW, 0, stageW, vH]
      const [aX, aY, aW, aH] = this.op.alphaDirection === 'right' ? [stageW, 0, stageW, vH] : [0, 0, stageW, vH]
      return {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH}
    }
  }
  public computeCoord(x: number, y: number, w: number, h: number, vw: number, vh: number) {
    // leftX rightX bottomY topY
    const leftX = x / vw
    const rightX = (x + w) / vw
    const bottomY = (vh - y - h) / vh
    const topY = (vh - y) / vh
    return [leftX, rightX, bottomY, topY]
  }

  public getScale() {
    let scaleX = 1
    let scaleY = 1
    if (this.video && this.op.mode) {
      const ofs = this.ofs
      const canvasAspect = ofs.clientWidth / ofs.clientHeight
      const videoAspect = ofs.width / ofs.height
      ofs.setAttribute('class', `e-video-${this.op.mode.toLocaleLowerCase()}`)
      switch (this.op.mode) {
        case 'AspectFill':
        case 'vertical': //fit vertical | AspectFill 竖屏
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          break
        case 'AspectFit':
        case 'horizontal': //fit horizontal | AspectFit 横屏
          scaleX = 1
          scaleY = canvasAspect / videoAspect
          break
        case 'contain':
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          if (scaleX > 1) {
            scaleY = 1 / scaleX
            scaleX = 1
          }
          break
        case 'Fill':
        case 'cover':
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          if (scaleX < 1) {
            scaleY = 1 / scaleX
            scaleX = 1
          }
          break
      }
    }
    return [scaleX, scaleY]
  }
  public setSizeCanvas(canvas: HTMLCanvasElement, resizeCanvas: ResizeCanvasType) {
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
  public resizeCanvasToDisplaySize() {
    const descript = this.videoEntity.config?.descript
    const ofs = this.ofs
    if (!descript) {
      if (!this.video) return
      const vw = this.video.videoWidth ? this.video.videoWidth / 2 : 900
      const vh = this.video.videoHeight ? this.video.videoHeight : 1000
      // 默认左右结构
      ofs.width = vw
      ofs.height = vh
    } else {
      // 实际渲染大小
      const [x, y, w, h] = descript.rgbFrame
      ofs.width = w
      ofs.height = h
    }
  }
}
