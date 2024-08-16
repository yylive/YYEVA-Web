import {logger} from 'src/helper/logger'
import {Canvas2dControl} from 'src/player/render/canvas2d/control'
import RenderCache from 'src/player/render/common/renderCache'
import VideoEntity from 'src/player/render/common/videoEntity'
import type {MixEvideoOptions, ResizeCanvasType, VideoAnimateDataItemType} from 'src/type/mix'
//
export default class Render2D extends Canvas2dControl {
  public isPlay = false
  // public webgl: any = {version: 'canvas2d'}
  public renderType = 'canvas2d'
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
  private alphaCanvas: HTMLCanvasElement | OffscreenCanvas
  private alphaCtx: CanvasRenderingContext2D

  private canvasKey: HTMLCanvasElement | OffscreenCanvas
  private ctxKey: CanvasRenderingContext2D

  //
  drawEffect: {[key: string]: any}
  constructor(op: MixEvideoOptions) {
    super()
    logger.debug('[Render In Canvas]')
    this.op = op
    //
    this.ofs = this.createCanvas()
    this.ctx = this.get2dContext(this.ofs)
    //
    this.renderCache = new RenderCache(this.ofs, this.op)
    this.videoEntity = new VideoEntity(op)
    //
    this.alphaCanvas = this.createCanvas()
    this.alphaCtx = this.get2dContext(this.alphaCanvas)
    //
    //
    this.drawEffect = {}

    this.canvasKey = this.createCanvas()
    this.ctxKey = this.get2dContext(this.canvasKey)
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
  /**
      sx	裁剪框右上角的x坐标
      sy	裁剪框右上角的y坐标
      sw	裁剪框的宽度
      sh	裁剪框的高度
   */
  private getScale() {
    const scaleX = 1
    const scaleY = 1
    //
    let [sx, sy, sw, sh, dx, dy, dw, dh]: number[] = []

    const ofs = this.canvas
    const vw = ofs.width
    const vh = ofs.height
    const cw = ofs.clientWidth
    const ch = ofs.clientHeight
    const cRate = ofs.clientWidth / ofs.clientHeight
    const vRate = ofs.width / ofs.height
    //
    dx = 0
    dy = 0
    dw = vw
    dh = vh
    sx = 0
    sy = 0
    sw = vw
    sh = vh
    // const scale = Math.min(cw / vw, ch / vh)
    // console.log('scale', scale)
    //
    // switch (this.op.mode) {
    //   case 'AspectFill':
    //   case 'vertical': //fit vertical | AspectFill 竖屏
    //     // if (vRate >= cRate) {
    //     sw = vh * cRate
    //     sh = vh
    //     sx = (vw - sw) / 2
    //     sy = 0
    //     // } else {
    //     //   sh = vw / cRate
    //     //   sw = vw
    //     //   sx = 0
    //     //   sy = (vw - sh) / 2
    //     // }
    //     break
    //   case 'AspectFit':
    //   case 'horizontal': //fit horizontal | AspectFit 横屏
    //     // scaleX = 1
    //     // scaleY = canvasAspect / videoAspect

    //     break
    //   case 'contain':
    //     // scaleY = 1
    //     // scaleX = videoAspect / canvasAspect
    //     // if (scaleX > 1) {
    //     //   scaleY = 1 / scaleX
    //     //   scaleX = 1
    //     // }
    //     break
    //   case 'Fill':
    //   case 'cover':
    //     // scaleY = 1
    //     // scaleX = videoAspect / canvasAspect
    //     // if (scaleX < 1) {
    //     //   scaleY = 1 / scaleX
    //     //   scaleX = 1
    //     // }
    //     break
    //   default:
    //     break
    // }
    if (this.op.mode) {
      sw = vh * cRate
      sh = vh
      sx = (vw - sw) / 2
      sy = 0
    }

    return [sx, sy, sw, sh, dx, dy, dw, dh]
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
    //
    if (!this.op.fps) {
      this.op.fps = 10
    }
    await this.videoEntity.setup()
    // console.log('fps', this.op.fps)
    //
    const canvas = document.createElement('canvas')
    this.op.container.appendChild(canvas)
    canvas.width = video.videoWidth / 2
    canvas.height = video.videoHeight
    this.context = canvas.getContext('2d')
    this.canvas = canvas
    //
    this.ofs.width = video.videoWidth
    this.ofs.height = video.videoHeight

    this.canvasKey.width = canvas.width
    this.canvasKey.height = canvas.height
    //
    const descript = this.videoEntity?.config?.descript
    const effect = this.videoEntity?.config?.effect
    if (descript) {
      const [x, y, w, h] = descript.rgbFrame
      canvas.width = w
      canvas.height = h
      this.ofs.width = descript.width
      this.ofs.height = descript.height
    }
    if (effect) {
      for (const k in effect) {
        const r = effect[k]
        if (r.img) {
          this.drawEffect[r.effectId] = r
        }
      }
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
    this.removeCanvas(this.ofs)
    this.removeCanvas(this.alphaCanvas)
    this.removeCanvas(this.canvasKey)
    this.drawEffect = undefined
  }
  clear() {
    if (typeof this.video !== 'undefined' && this.context)
      this.context.clearRect(0, 0, this.video?.videoWidth, this.video?.videoHeight)
  }
  render(frame = 0) {
    const {width: w, height: h} = this.canvas
    //
    const [sx, sy, sw, sh, dx, dy, dw, dh] = this.getScale()
    // console.log('scale', sx, sy, sw, sh, dx, dy, dw, dh, w, h)
    // cache获取帧动画直接渲染 不用处理坐标
    //***取消canvas2d的缓存功能
    // this.drawWithCache(frame)
    const descript = this.videoEntity?.config?.descript
    if (descript) {
      this.renderMix(frame)
    } else {
      this.renderLR(frame)
    }
    this.context.clearRect(dx, dy, dw, dh)
    this.context.drawImage(this.ofs, sx, sy, sw, sh, dx, dy, dw, dh)
    //***取消canvas2d的缓存功能
    // this.saveFrameCache(frame)
  }
  /* private getimgDataByBitmap(bitmap, w, h) {
    const canvas = document.createElement('canvas')
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
    return canvas.getContext('2d').getImageData(0, 0, w, h)
  } */
  drawWithCache(frame) {
    if (this.op.useFrameCache) {
      const [sx, sy, sw, sh, dx, dy, dw, dh] = this.getScale()
      const frameItem = this.renderCache.getCache(frame)
      console.log('[canvas2d frameItem]', frame, frameItem)
      if (frameItem && frameItem !== 'skip') {
        // this.context.clearRect(0, 0, w, h)
        // this.context.drawImage(frameItem, 0, 0, w, h, 0, 0, w, h)
        this.context.clearRect(dx, dy, dw, dh)
        this.context.drawImage(frameItem, sx, sy, sw, sh, dx, dy, dw, dh)
        return true
      }
    }
  }
  saveFrameCache(frame) {
    if (this.op.useFrameCache) {
      this.renderCache.setCache(frame)
    }
  }
  renderKey(frame = 0) {
    const frameData = this.videoEntity.getFrame(frame)
    const frameItem = frameData ? frameData[this.videoEntity.data] : undefined
    // let posArr: any = []
    // const {width: vW, height: vH} = descript
    // console.log('effect', frameItem)
    if (frameItem) {
      frameItem.forEach((o: VideoAnimateDataItemType) => {
        // const [rgbX, rgbY] = descript.rgbFrame
        const [x, y, w, h] = o[this.videoEntity.renderFrame]
        const [mX, mY, mW, mH] = o[this.videoEntity.outputFrame]
        const effectId = o[this.videoEntity.effectId]
        const isTextType = this.videoEntity.isTextTypeById(effectId)

        // logger.debug(
        //   'renderKey: ',
        //   mX,
        //   mY,
        //   mW,
        //   mH,
        //   x,
        //   y,
        //   w,
        //   h,
        //   ', effectId=' + effectId + ',frame=' + frame + ',scale=' + w / mW,
        //   ',isTextType=' + isTextType 
        // )
        const r = this.drawEffect[effectId] || {}

        if (r.img && w > 0 && h > 0 && mH > 0 && mW > 0) {
          this.ctxKey.clearRect(0, 0, w, h)
          this.ctxKey.drawImage(r.img, 0, 0, w, h)          
          let imageData = this.ctxKey.getImageData(0, 0, w, h)
          // text key合并alphaData会显示黑色背景，暂时不合并alphaData，能满足绝大部分的需求，后续再进一步优化text key的渲染
          if (!isTextType) {            
            const alphaData = this.ctx.getImageData(mX, mY, mW, mH)
            imageData = this.mixImageData(imageData, alphaData, w / mW)
          }

          this.ctxKey.clearRect(0, 0, w, h)
          this.ctxKey.putImageData(imageData, 0, 0)

          this.ctx.drawImage(this.canvasKey, 0, 0, w, h, x, y, w, h)
        }
      })
    }
  }
  renderMix(frame = 0) {
    const descript = this.videoEntity.config?.descript
    if (!this.ctx || !this.isPlay || typeof this.video === 'undefined' || !descript) return
    // console.log(info)
    const [x, y, w, h] = descript.rgbFrame
    const [ax, ay, aw, ah] = descript.alphaFrame
    this.ctx.clearRect(ax, ay, w, h) //清空alpha图层
    //
    // console.log(' descript.alphaFrame', descript.alphaFrame)
    const vw = this.video.videoWidth
    const vh = this.video.videoHeight
    this.ctx.drawImage(this.video, 0, 0, vw, vh, 0, 0, vw, vh)
    //合并alpha图层
    let colorImageData = this.ctx.getImageData(x, y, w, h)
    const alpathImageData = this.ctx.getImageData(ax, ay, aw, ah)
    colorImageData = this.mixImageData(colorImageData, alpathImageData, w / aw)
    // console.log('renderMix scale=', w / aw, 'frame=' + frame)
    this.ctx.clearRect(0, 0, w, h)
    this.ctx.putImageData(colorImageData, 0, 0, 0, 0, w, h)
    // this.ctx.clearRect(ax, ay, w, h) //清空alpha图层
    // this.ctx.putImageData(alpathImageData, 0, 0, 0, 0, w, h)
    // 渲染 key list
    this.renderKey(frame)
    //
    // this.ctx.clearRect(ax, ay, w, h) //清空alpha图层
  }

  mixImageData(colorImageData, alpathImageData, scale = 1) {
    if (Math.abs(scale - 1) > 0.001) alpathImageData = this.scaleImageData(alpathImageData, scale)
    const len = Math.min(colorImageData?.data.length, alpathImageData?.data.length)
    for (let i = 3; i < len; i += 4) {
      const opacity = alpathImageData.data[i - 1]
      colorImageData.data[i] = opacity
      if (opacity > 0) {
        colorImageData.data[i - 1] = Math.min(255, Math.ceil((colorImageData.data[i - 1] * 255) / opacity))
        colorImageData.data[i - 2] = Math.min(255, Math.ceil((colorImageData.data[i - 2] * 255) / opacity))
        colorImageData.data[i - 3] = Math.min(255, Math.ceil((colorImageData.data[i - 3] * 255) / opacity))
      }
    }
    return colorImageData
  }
  // scaleImageData(imageData, scale) {
  //   const ctx = this.alphaCtx
  //   const scaled = ctx.createImageData(imageData.width * scale, imageData.height * scale)
  //   const subLine = ctx.createImageData(scale, 1).data
  //   for (let row = 0; row < imageData.height; row++) {
  //     for (let col = 0; col < imageData.width; col++) {
  //       const sourcePixel = imageData.data.subarray(
  //         (row * imageData.width + col) * 4,
  //         (row * imageData.width + col) * 4 + 4,
  //       )
  //       for (let x = 0; x < scale; x++) subLine.set(sourcePixel, x * 4)
  //       for (let y = 0; y < scale; y++) {
  //         const destRow = row * scale + y
  //         const destCol = col * scale
  //         scaled.data.set(subLine, (destRow * scaled.width + destCol) * 4)
  //       }
  //     }
  //   }

  //   return scaled
  // }
  scaleImageData(imageData, scale) {
    if (scale == 1) {
      return imageData
    }

    const ctx = this.alphaCtx
    const scaleWidth = Math.floor(imageData.width * scale)
    const scaleHeight = Math.floor(imageData.height * scale)
    const scaled = ctx.createImageData(scaleWidth, scaleHeight)
    const imageDataWidth = imageData.width
    const imageDataHeight = imageData.height

    for (let row = 0; row < imageDataHeight; row++) {
      for (let col = 0; col < imageDataWidth; col++) {
        const sourcePixel = [
          imageData.data[(row * imageData.width + col) * 4 + 0],
          imageData.data[(row * imageData.width + col) * 4 + 1],
          imageData.data[(row * imageData.width + col) * 4 + 2],
          imageData.data[(row * imageData.width + col) * 4 + 3],
        ]
        for (let y = 0; y < scale; y++) {
          const destRow = Math.floor(row * scale) + y
          for (let x = 0; x < scale; x++) {
            const destCol = Math.floor(col * scale) + x
            for (let i = 0; i < 4; i++) {
              scaled.data[(destRow * scaleWidth + destCol) * 4 + i] = sourcePixel[i]
            }
          }
        }
      }
    }

    return scaled
  }
  renderLR(frame = 0) {
    if (!this.ctx || !this.isPlay || typeof this.video === 'undefined') return
    const vw = this.video.videoWidth
    const vh = this.video.videoHeight
    const stageWidth = vw / 2
    const stageHeight = vh
    this.ctx.drawImage(this.video, 0, 0, vw, vh, 0, 0, vw, vh)
    // 渲染 key list
    // this.renderKey(frame)// descript为空时 没有 key
    //
    if (this.op.alphaDirection === 'left') {
      const colorImageData = this.ctx.getImageData(stageWidth, 0, stageWidth, stageHeight)
      const alpathImageData = this.ctx.getImageData(0, 0, stageWidth, stageHeight)
      this.mixImageData(colorImageData, alpathImageData)
      this.ctx.putImageData(colorImageData, 0, 0, 0, 0, stageWidth, stageHeight)
    } else {
      const alpathImageData = this.ctx.getImageData(stageWidth, 0, stageWidth, stageHeight)
      const colorImageData = this.ctx.getImageData(0, 0, stageWidth, stageHeight)
      this.mixImageData(colorImageData, alpathImageData)
      this.ctx.putImageData(colorImageData, 0, 0, 0, 0, stageWidth, stageHeight)
      // this.ctx.clearRect(ax, ay, w, h) //清空alpha图层 这个一般用不到
    }
  }
}
