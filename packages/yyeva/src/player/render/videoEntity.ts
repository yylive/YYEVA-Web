import {logger} from 'src/helper/logger'
import {isDataUrl} from 'src/helper/utils'
import Animator from 'src/player/video/animator'
import {MixEvideoOptions, VideoAnimateType, VideoAnimateEffectType, VideoDataType, EScaleMode} from 'src/type/mix'

type ContextType = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
export default class VideoEntity {
  public op: MixEvideoOptions
  public fps = 30
  public videoFps = 30
  public config?: VideoAnimateType
  public isUseMeta = false
  public hasAudio = false
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
    const ctx = canvas.getContext('2d', {willReadFrequently: true}) // willReadFrequently 表示是否计划有大量的回读操作，频繁调用getImageData()方法时能节省内存
    // canvas.style.display = 'none'
    // document.body.appendChild(canvas)
    this.ctx = ctx as any
    this.ofs = canvas
    if (op.useMetaData) {
      this.isUseMeta = true
    }
    /**
     * polyfill map
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
      this.fps = config.descript.fps
      this.videoFps = config.descript.fps
    }
    if (config.descript.hasAudio) {
      this.hasAudio = true
    }
  }
  async setup() {
    if (this.op.dataUrl) {
      const {info, src, frame}: any = await this.getConfig(this.op.dataUrl)
      this.fps = info.fps || this.fps
      if (info.fps) {
        this.videoFps = info.fps
      }
      // console.log('info.fps', info.fps, 'this.fps', this.fps)
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
    if (this.op.fps) this.fps = this.op.fps
    // *** requestAnimationFrame 需要降帧防止抖动
    // console.log('this.fps', this.fps)
    await this.parseFromSrcAndOptions()
  }
  private get isUseBitmap() {
    return !!self.createImageBitmap && this.op.useBitmap
  }
  //
  private dataURItoBlob(dataURI: string) {
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0] // mime类型
    const byteString = self.atob(dataURI.split(',')[1]) //base64 解码
    const arrayBuffer = new ArrayBuffer(byteString.length) //创建缓冲数组
    const intArray = new Uint8Array(arrayBuffer) //创建视图

    for (let i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i)
    }
    return new Blob([intArray], {type: mimeString})
  }
  /* private fileToDataUrl(file: HTMLInputElement): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file.files[0])
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = e => reject(undefined)
    })
  } */
  /* private fileToBlob(file: HTMLInputElement): Promise<Blob | undefined> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsArrayBuffer(file.files[0])
      reader.onloadend = () => {
        const blob = new Blob([new Uint8Array(reader.result as ArrayBuffer)], {type: file.type})
        resolve(blob)
      }
      reader.onerror = e => reject(undefined)
    })
  } */
  private createImageElement(url): Promise<HTMLImageElement | undefined> {
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
  /**
   * loadImg
   * @param url 支持 HTTP DATAURL
   * @returns
   */
  private async loadImg(url: string): Promise<HTMLImageElement | ImageBitmap | undefined> {
    try {
      const isBase64 = isDataUrl(url)
      if (this.isUseBitmap) {
        let blob
        // 取消 HTMLInputElement 对象
        // if (url instanceof HTMLInputElement) {
        //   blob = await this.fileToBlob(url)
        // } else {
        if (isBase64) {
          blob = this.dataURItoBlob(url)
          // base 64 不需要执行 imageOrientation: 'flipY'
          // return self.createImageBitmap(blob)
        } else {
          blob = await fetch(url)
            .then(r => {
              if (r.ok) {
                return r.blob()
              } else {
                logger.error('fetch request failed, url: ' + url)
                return undefined
              }
            })
            .catch(err => {
              logger.error('fetch, err=', err)
              return undefined
            })
        }
        // const img = document.createElement('img')
        // img.src = URL.createObjectURL(blob)
        // document.body.appendChild(img)
        // console.log(blob)
        // }
        // 适配 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1) 解决自动翻转的问题
        if (blob) {
          return self.createImageBitmap(blob, {imageOrientation: 'flipY'})
        } else {
          return undefined
        }
      }
      // if (url instanceof HTMLInputElement) {
      //   url = await this.fileToDataUrl(url)
      // } else if (typeof url === 'string' && url.indexOf('http') === -1 && !isBase64) {
      //   url = `${location.protocol}//${location.host}${url}`
      // }
      if (typeof url === 'string' && url.indexOf('http') === -1 && !isBase64) {
        url = `${location.protocol}//${location.host}${url}`
      }
      // url base64 都可以创建 image element
      return this.createImageElement(url)
    } catch (e) {
      logger.warn('fetch, else err=', e)
      // this.op?.onEnd?.(e)
      return undefined
    }
  }

  private parseFromSrcAndOptions() {
    if (!this.config?.effect) return
    const effects = this.op.effects || {}
    // logger.debug('parseFromSrcAndOptions, this.config.effect=', this.config.effect, effects)
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
            const eOptions = {
              fontStyle: effects.fontStyle,
              fontColor: effects.fontColor,
              fontSize: effects.fontSize,
            }

            if (typeof effects[effectTag] === 'string') {
              item.text = effects[effectTag]
            } else {
              item.text = effects[effectTag].text

              const style = effects[effectTag]
              if (style.fontStyle) eOptions.fontStyle = style.fontStyle
              if (style.fontColor) eOptions.fontColor = style.fontColor
              if (style.fontSize) eOptions.fontSize = style.fontSize
            }
            item.img = await this.makeTextImg(item, eOptions, item.effectHeight)
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
    const w = Math.ceil(item[this.effectWidth])
    const h = Math.ceil(item[this.effectHeight])
    let img = null
    if (url) {
      img = await this.loadImg(url)
    }
    // const isBase64 = isDataUrl(url)
    ctx.canvas.width = w
    ctx.canvas.height = h
    // console.log(`makeImage`, item.scaleMode, w, h, img)
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
            const sx = Math.round((w - drawWidth) / 2)
            const sy = Math.round((drawHeight - h) / 2)
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
            ctx.translate(0, drawHeight)
            ctx.scale(1, -1)
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
            const sx = Math.round((w - drawWidth) / 2)
            const sy = Math.round((drawHeight - h) / 2)
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
            ctx.translate(0, drawHeight)
            ctx.scale(1, -1)
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

  _getText(ctx: ContextType, text: string, maxWidth: number): string {
    if (!this.op?.font?.overflow || this.op.font.overflow === 'cut') {
      const textWidth = ctx.measureText(text).width
      if (maxWidth == undefined) {
        maxWidth = textWidth
      } else if (textWidth > maxWidth) {
        let len = text.length
        while (ctx.measureText(text + '...').width > maxWidth && len > 0) {
          len = len - 1
          text = text.substring(0, len)
        }
        text = text + '...'
      }
    }

    return text
  }

  /**
   * 文字转换图片
   * @param item
   */
  private async makeTextImg(item: VideoAnimateEffectType, eOptions: any = {}, width = 0) {
    if (!this.ctx) return
    const ctx = this.ctx
    // console.log(`[makeTextImg] eOptions:`, eOptions)
    if (eOptions.fontStyle) item.fontStyle = eOptions.fontStyle
    if (eOptions.fontColor) item.fontColor = eOptions.fontColor
    if (eOptions.fontSize) item.fontSize = eOptions.fontSize
    const {fontStyle, fontColor, fontSize} = item
    //
    const w = Math.ceil(item[this.effectWidth])
    const h = Math.ceil(item[this.effectHeight])
    ctx.canvas.width = w
    ctx.canvas.height = h
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    const txt = item.text || ''
    const txtlength = txt.length
    const defaultFontSize = h - 2
    // console.log(
    //   `[makeTextImg]: fontStyle${fontStyle}, fontColor${fontColor}, fontSize${fontSize}, w${w}, h${h}, txt${txt}, txtlength:${txtlength}`,
    //   this.op,
    // )

    const getFontStyle = (fontSize?: number) => {
      fontSize = fontSize || defaultFontSize
      if (!this.op?.font?.overflow || this.op.font.overflow === 'cut') {
        // const maxFontLength = Math.ceil(w / fontSize) - 2
        // if (txtlength > maxFontLength) {
        //   txt = txt.substring(0, maxFontLength) + '...'
        // }
      } else if (fontSize * txtlength > w - 1) {
        fontSize = Math.min((w / txtlength) * 1, defaultFontSize)
      }

      const font = ['600', `${Math.round(fontSize)}px`, 'SimHei']
      if (fontStyle === 'b') {
        font.unshift('bold')
      }
      // console.log(`getFontStyle`, font)
      return font.join(' ')
    }
    if (!fontStyle) {
      const fontStyle = getFontStyle(fontSize)
      ctx.font = fontStyle
      if (fontColor) ctx.fillStyle = fontColor
    } else if (typeof fontStyle == 'string') {
      ctx.font = fontStyle
      if (fontColor) ctx.fillStyle = fontColor
    } else if (typeof fontStyle == 'object') {
      ctx.font = fontStyle['font'] || getFontStyle(fontSize)
      ctx.fillStyle = fontStyle['color'] || fontColor
    } else if (typeof fontStyle == 'function') {
      ctx.font = getFontStyle(fontSize)
      if (fontColor) ctx.fillStyle = fontColor
      fontStyle(null, ctx, item)
    }
    logger.info('getFontStyle, style: ', ctx.font, ', text:', txt)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    const posx = Math.floor(w / 2)
    const posy = Math.floor(h / 2)
    ctx.fillText(this._getText(ctx, txt, w), posx, posy)
    if (!!self.OffscreenCanvas && this.ofs instanceof OffscreenCanvas) {
      const blob = await this.ofs.convertToBlob()
      const bitmap = await self.createImageBitmap(blob, {imageOrientation: 'flipY'})
      return bitmap
    }
    return ctx.getImageData(0, 0, w, h)
  }
  getFrame(frame: number) {
    return (
      this.config.datas &&
      this.config.datas.find(item => {
        return item[this.frameIndex] === frame
      })
    )
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
