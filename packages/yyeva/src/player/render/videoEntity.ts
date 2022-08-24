import {logger} from 'src/helper/logger'
import {isDataUrl} from 'src/helper/utils'
import Animator from 'src/player/video/animator'
import {MixEvideoOptions, VideoAnimateType, VideoAnimateEffectType, VideoDataType, EScaleMode} from 'src/type/mix'
export default class VideoEntity {
  public op: MixEvideoOptions
  static fps = 30
  static VideoFps = 30
  public config?: VideoAnimateType
  public isUseMeta = false
  static hasAudio = false
  //
  private ofs: HTMLCanvasElement | OffscreenCanvas
  private ctx: CanvasRenderingContext2D | null | OffscreenCanvasRenderingContext2D
  //
  private effectTypes = {
    txt: ['txt', 'text'],
    img: ['img', 'image'],
  }
  // data keys
  public effectWidth = 'effectWidth'
  public effectHeight = 'effectHeight'
  public effectTag = 'effectTag'
  public effectType = 'effectType'
  public effectId = 'effectId'
  public renderFrame = 'renderFrame'
  public outputFrame = 'outputFrame'
  public frameIndex = 'frameIndex'
  public scaleMode = 'scaleMode'
  public data = 'data'
  //
  constructor(op: MixEvideoOptions) {
    this.op = op
    const canvas = !!self.OffscreenCanvas ? new OffscreenCanvas(300, 300) : document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // canvas.style.display = 'none'
    // document.body.appendChild(canvas)
    this.ctx = ctx
    this.ofs = canvas
    if (op.useMetaData) {
      this.isUseMeta = true
    }
    /**
     * 腾讯视频 VAP
     */
    if (op.dataUrl) {
      this.effectHeight = 'h'
      this.effectWidth = 'w'
      this.effectTag = 'srcTag'
      this.effectType = 'srcType'
      this.effectId = 'srcId'
      this.renderFrame = 'frame'
      this.outputFrame = 'mFrame'
      this.frameIndex = 'i'
      this.data = 'obj'
    }
  }

  destroy() {
    if (this.ofs) {
      this.ctx = null
      if (this.ofs instanceof HTMLCanvasElement) this.ofs.remove()
      else this.ofs = undefined
    }
    this.config = undefined
  }
  /**
   * yy视频设置
   * @param config
   */
  setConfig(config: VideoAnimateType) {
    // this.config = data
    this.config = config
    if (config.descript.fps) {
      VideoEntity.fps = config.descript.fps
      VideoEntity.VideoFps = config.descript.fps
    }
    if (config.descript.hasAudio) {
      VideoEntity.hasAudio = true
    }
  }
  async setup() {
    if (this.op.dataUrl) {
      const {info, src, frame}: any = await this.getConfig(this.op.dataUrl)
      VideoEntity.fps = info.fps || VideoEntity.fps
      if (info.fps) {
        VideoEntity.VideoFps = info.fps
      }
      // console.log('info.fps', info.fps, 'VideoEntity.fps', VideoEntity.fps)
      this.config = {
        descript: {
          width: info.videoW,
          height: info.videoH,
          isEffect: info.isVapx,
          rgbFrame: info.rgbFrame,
          alphaFrame: info.aFrame,
          fps: info.fps,
          version: 0,
        },
        effect: src,
        datas: frame,
      }
    }
    if (this.op.fps) VideoEntity.fps = this.op.fps
    // *** requestAnimationFrame 需要降帧防止抖动
    if (
      Animator.animationType !== 'requestVideoFrameCallback' &&
      VideoEntity.fps > 20
      //  && !this.op.fps
    ) {
      VideoEntity.fps = 20
    }
    // console.log('VideoEntity.fps', VideoEntity.fps)
    await this.parseFromSrcAndOptions()
  }
  private get isUseBitmap() {
    return !!self.createImageBitmap && this.op.useBitmap
  }

  private async loadImg(url: string): Promise<HTMLImageElement | ImageBitmap | undefined> {
    if (url.indexOf('http') === -1 && !isDataUrl(url)) {
      url = `${location.protocol}//${location.host}${url}`
    }
    if (this.isUseBitmap && !isDataUrl(url)) {
      try {
        const blob = await fetch(url).then(r => r.blob())
        // 适配 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1) 解决自动翻转的问题
        const d = await self.createImageBitmap(blob, {imageOrientation: 'flipY'})
        return d
      } catch (e) {
        logger.error(e)
        this.op?.onEnd?.(e)
        return undefined
      }
    }
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = function () {
        resolve(img)
      }
      img.onerror = function (e) {
        logger.error('frame load fail:' + url)
        // reject(new Error('frame load fail:' + url))
        reject(undefined)
      }
      img.src = url
    })
  }

  private parseFromSrcAndOptions() {
    if (!this.config?.effect) return
    const effects = this.op.effects || {}
    return Promise.all(
      this.config.effect.map(async item => {
        //
        const effectType = item[this.effectType]
        const effectTag = item[this.effectTag]
        // text
        if (this.effectTypes.txt.indexOf(effectType) > -1) {
          // if (this.op['fontStyle'] && !item['fontStyle']) {
          //   item['fontStyle'] = this.op['fontStyle']
          // }
          if (effects[effectTag]) {
            if (typeof effects[effectTag] === 'string') {
              item.text = effects[effectTag]
            } else {
              item.text = effects[effectTag].text
            }
            item.img = await this.makeTextImg(item, effects[effectTag])
          }
        } // image
        else if (this.effectTypes.img.indexOf(effectType) > -1) {
          // console.log(`[effect] effectTag:`, effectTag, ':', effects[effectTag])
          item.img = await this.makeImage(item, effects[effectTag])
        }
      }),
    )
  }
  /**
   * effect 图片处理
   * @param item
   * @param eOptions
   * @returns
   */
  private async makeImage(item: VideoAnimateEffectType, url: string) {
    // console.log(`[effect] makeImage:`, item, url)
    if (!this.ctx) return
    const ctx = this.ctx
    const w = item[this.effectWidth]
    const h = item[this.effectHeight]
    let img = null
    if (url && url.length > 0) {
      img = await this.loadImg(url)
    }
    ctx.canvas.width = w
    ctx.canvas.height = h
    if (item.scaleMode && img) {
      switch (item.scaleMode) {
        case EScaleMode.aspectFill: // 最大适配
          {
            let adapt = 1
            if (w / h > img.width / img.height) {
              adapt = w / img.width
            } else {
              adapt = h / img.height
            }
            const drawWidth = Math.round(img.width * adapt)
            const drawHeight = Math.round(img.height * adapt)
            const sx = -Math.round(Math.abs(drawWidth - w) / 2)
            const sy = -Math.round(Math.abs(drawHeight - h) / 2)
            // console.log(
            //   `[effect] before draw: w ,h ,drawWidth, drawHeight, sx, sy, adapt`,
            //   w,
            //   h,
            //   drawWidth,
            //   drawHeight,
            //   sx,
            //   sy,
            //   adapt,
            // )
            ctx.save()
            if (!isDataUrl(url)) {
              ctx.translate(0, drawHeight)
              ctx.scale(1, -1)
            }
            ctx.drawImage(img, sx, sy, drawWidth, drawHeight)
            ctx.restore()
            return ctx.getImageData(0, 0, w, h)
          }
          break
        case EScaleMode.aspectFit: // 最小适配
          {
            let adapt = 1
            if (w / h < img.width / img.height) {
              adapt = w / img.width
            } else {
              adapt = h / img.height
            }
            const drawWidth = Math.round(img.width * adapt)
            const drawHeight = Math.round(img.height * adapt)
            const sx = -Math.round(Math.abs(drawWidth - w) / 2)
            const sy = -Math.round(Math.abs(drawHeight - h) / 2)
            // console.log(
            //   `[effect] before draw: w ,h ,drawWidth, drawHeight, sx, sy, adapt`,
            //   w,
            //   h,
            //   drawWidth,
            //   drawHeight,
            //   sx,
            //   sy,
            //   adapt,
            // )
            ctx.save()
            if (!isDataUrl(url)) {
              ctx.translate(0, drawHeight)
              ctx.scale(1, -1)
            }
            ctx.drawImage(img, sx, sy, drawWidth, drawHeight)
            ctx.restore()
            return ctx.getImageData(0, 0, w, h)
          }
          break
        case EScaleMode.scaleFill: // 变形适配
          return img
          break
        default:
          return img
      }
    } else if (img) {
      return img
    } else {
      // 挖空区域
      ctx.clearRect(0, 0, w, h)
      return ctx.getImageData(0, 0, w, h)
    }
  }
  /**
   * 文字转换图片
   * @param item
   */
  private async makeTextImg(item: VideoAnimateEffectType, eOptions: any = {}) {
    if (!this.ctx) return
    const ctx = this.ctx
    if (eOptions.fontStyle) item.fontStyle = eOptions.fontStyle
    if (eOptions.fontColor) item.fontColor = eOptions.fontColor
    if (eOptions.fontSize) item.fontSize = eOptions.fontSize
    const {fontStyle, fontColor, fontSize} = item
    //
    const w = item[this.effectWidth]
    const h = item[this.effectHeight]
    ctx.canvas.width = w
    ctx.canvas.height = h
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    const txt = item.text || ''
    const getFontStyle = (fontSize?: number) => {
      fontSize = fontSize || Math.min(w / txt.length, h - 8) // 需留一定间隙
      const font = ['600', `${Math.round(fontSize)}px`, 'Microsoft YaHei']
      if (fontStyle === 'b') {
        font.unshift('bold')
      }
      return font.join(' ')
    }
    if (!fontStyle) {
      const fontStyle = getFontStyle(item.fontSize)
      ctx.font = fontStyle
      if (fontColor) ctx.fillStyle = fontColor
    } else if (typeof fontStyle == 'string') {
      ctx.font = fontStyle
      if (fontColor) ctx.fillStyle = fontColor
    } else if (typeof fontStyle == 'object') {
      ctx.font = fontStyle['font'] || getFontStyle()
      ctx.fillStyle = fontStyle['color'] || fontColor
    } else if (typeof fontStyle == 'function') {
      ctx.font = getFontStyle(fontSize)
      if (fontColor) ctx.fillStyle = fontColor
      fontStyle(null, ctx, item)
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillText(txt, w / 2, h / 2)
    if (!!self.OffscreenCanvas && this.ofs instanceof OffscreenCanvas) {
      const blob = await this.ofs.convertToBlob()
      const bitmap = await self.createImageBitmap(blob, {imageOrientation: 'flipY'})
      return bitmap
    }
    return ctx.getImageData(0, 0, w, h)
  }
  getFrame(frame: number) {
    return this.config?.datas.find(item => {
      return item[this.frameIndex] === frame
    })
  }
  private getConfig(jsonUrl: string): Promise<VideoDataType> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', jsonUrl, true)
      xhr.responseType = 'json'
      xhr.onload = function () {
        if (xhr.status === 200 || (xhr.status === 304 && xhr.response)) {
          const res = xhr.response
          resolve(res)
        } else {
          reject(new Error('http response invalid' + xhr.status))
        }
      }
      xhr.send()
    })
  }
}
