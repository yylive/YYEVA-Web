import {MixEvideoOptions} from 'src/type/mix'
import MCache from './mCache'
class RenderCache {
  private canvas: HTMLCanvasElement | OffscreenCanvas
  private op: MixEvideoOptions
  mCache: MCache
  constructor(canvas: HTMLCanvasElement | OffscreenCanvas, op: MixEvideoOptions) {
    this.canvas = canvas
    this.op = op
    this.mCache = new MCache(this.op)
  }
  isCache() {
    return this.mCache.isCache()
  }
  setCache(frame: number) {
    // if (!this.op.loop && !this.op.useFrameCache) return
    if (!this.op.useFrameCache) return
    this.createFramesCache(frame)
  }
  getCache(frame: number) {
    // if (!this.op.loop && !this.op.useFrameCache) return undefined
    if (!this.op.useFrameCache) return undefined
    return this.mCache.getFrame(frame)
  }
  /**
   * 注销缓存
   */
  public destroy() {
    this.mCache.destroy()
  }
  /**
   * 申请缓存
   */
  public async setup() {
    if (this.op.useFrameCache) await this.mCache.setup()
  }
  private async createFramesCache(frame: number) {
    // console.log('[mcache][this.canvas]', this.canvas)
    if (!this.canvas) return
    // if (!!self.OffscreenCanvas && this.canvas instanceof OffscreenCanvas) {
    //   const bitmap = this.canvas.transferToImageBitmap()
    //   // const blob = await this.canvas.convertToBlob()
    //   // const bitmap = await self.createImageBitmap(blob)
    //   this.mCache.setFrame(frame, bitmap)
    //   // console.log('[transferToImageBitmap]', bitmap)
    // } else if (this.canvas instanceof HTMLCanvasElement) {
    if (this.op.useBitmap && self.createImageBitmap) {
      self.createImageBitmap(this.canvas).then(bitmap => {
        this.mCache.setFrame(frame, bitmap)
      })
    } else if ('toDataURL' in this.canvas) {
      const ofsImageBase64 = this.canvas.toDataURL()
      const ofsImage = new Image()
      ofsImage.src = ofsImageBase64
      this.mCache.setFrame(frame, ofsImage)
    }
    // old version 保留观察是否有改观
    /*
      this.canvas.toBlob(blob => {
        if (!blob) return
        if (this.op.useBitmap && self.createImageBitmap) {
          self.createImageBitmap(blob).then(bitmap => {
            this.mCache.setFrame(frame, bitmap)
          })
        } else {
          const ofsImage = new Image()
          ofsImage.src = URL.createObjectURL(blob)
          // 增加 onload 事件 解决第一次加载会闪屏的问题
          ofsImage.onload = () => {
            this.mCache.setFrame(frame, ofsImage)
          }
        }
      })
			*/
    // }
  }
}
export default RenderCache
