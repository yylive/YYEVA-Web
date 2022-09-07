import {MixEvideoOptions} from 'src/type/mix'
import {logger} from 'src/helper/logger'
import Animator from 'src/player/video/animator'
import VideoEntity from './videoEntity'
import {isDataUrl} from 'src/helper/utils'
import EVideo from 'src/player'
export type MCacheItem = {[frames: number]: ImageBitmap | HTMLImageElement | undefined}
//
function setStoreName(op: MixEvideoOptions) {
  const {effects, mode, container} = op
  let storeName = isDataUrl(EVideo.url) ? EVideo.url.substring(22, 88) : EVideo.url
  // let storeName = EVideo.url
  if (effects) {
    const eUrl = Object.keys(effects)
      .map(key => key + '=' + effects[key])
      .join('&')
    storeName += eUrl.indexOf('?') > -1 ? '&' : '?'
    storeName += eUrl
  }
  if (container && container.clientHeight) {
    storeName += `${storeName.indexOf('?') > -1 ? '&' : '?'}mode=${mode}&height=${container.clientHeight}&width=${
      container.clientWidth
    }`
  }
  storeName = storeName.replace(/\s+/g, '')
  // console.log(`storeName`, storeName)
  return storeName
}
//
export default class MCache {
  static caches: {[url: string]: MCacheItem} = {}
  static cacheKeys: string[] = []
  static cachesOfs: {[url: string]: HTMLCanvasElement | OffscreenCanvas} = {}
  static videoDurationTime = 0
  storeName: string
  op: MixEvideoOptions
  // currentFrame = -1
  frameCacheCount = 5
  requestAnimationFramePercent = 0.95
  private hasRequestAnimationFrame = false
  constructor(op: MixEvideoOptions) {
    if (!EVideo.url || !op.useFrameCache) return
    this.op = op
    this.storeName = setStoreName(op)
    if (!MCache.caches[this.storeName]) {
      logger.debug('[mCache]', '[实例化]')
      MCache.caches[this.storeName] = {}
      MCache.cacheKeys.push(this.storeName)
    }
    if (typeof op.useFrameCache === 'number' && op.useFrameCache > 0) {
      this.frameCacheCount = op.useFrameCache
    }
    logger.debug(
      `[mcache]`,
      `[constructor] [animationType ${Animator.animationType}]`,
      `设置缓存数`,
      this.frameCacheCount,
      `缓存视频`,
      MCache.cacheKeys,
    )
    logger.debug(`[mcache]`, this.storeName, `当前缓存帧数 ${Object.keys(MCache.caches[this.storeName] || {}).length}`)
  }
  /*
  static getOfs(op) {
    const storeName = setStoreName(op)
    if (!MCache.cachesOfs[storeName]) {
      MCache.cachesOfs[storeName] = !!self.OffscreenCanvas
        ? new OffscreenCanvas(300, 300)
        : document.createElement('canvas')
    }
    return MCache.cachesOfs[storeName]
  }*/
  public async setup() {
    this.setAnimationStatus()
  }
  setAnimationStatus() {
    // logger.debug(
    //   `setAnimationStatus`,
    //   MCache.videoDurationTime * VideoEntity.fps * this.requestAnimationFramePercent,
    //   Object.keys(MCache.caches[this.storeName] || {}).length,
    // )
    if (
      Animator.animationType !== 'requestVideoFrameCallback' &&
      Object.keys(MCache.caches[this.storeName] || {}).length > 0
    ) {
      this.hasRequestAnimationFrame = true
    }
    logger.debug('[mCache]', '[setAnimationStatus]', 'hasRequestAnimationFrame', this.hasRequestAnimationFrame)
  }
  isCache() {
    return Object.keys(MCache.caches[this.storeName]).length > 0
  }
  get() {
    return MCache.caches[this.storeName]
  }
  set(d: MCacheItem) {
    MCache.caches[this.storeName] = d
  }
  getFrame(frame: number) {
    // 不补全遗留帧 避免抖动，考虑是否 requestVideoFrameCallback 也需要这样操作
    if (this.hasRequestAnimationFrame) {
      // if (frame === this.currentFrame) {
      //   // console.log('=== skip ========================')
      //   return 'skip'
      // }
      // console.log('hasRequestAnimationFrame skip', frame)
      // this.currentFrame = frame
      return MCache.caches[this.storeName] && MCache.caches[this.storeName][frame]
        ? MCache.caches[this.storeName][frame]
        : 'skip'
    }
    // if (frame === this.currentFrame) {
    //   // console.log('=== skip ========================')
    //   return 'skip'
    // }
    // console.log('<<< get frame', frame, this.currentFrame)
    // this.currentFrame = frame
    return MCache.caches[this.storeName] ? MCache.caches[this.storeName][frame] : undefined
  }
  setFrame(frame: number, d: ImageBitmap | HTMLImageElement) {
    // console.log('MCache.caches[this.storeName]', MCache.caches[this.storeName], this.storeName)
    if (d && !MCache.caches[this.storeName][frame] && !this.hasRequestAnimationFrame) {
      // console.log('>>> set frame', frame)
      MCache.caches[this.storeName][frame] = d
    }
  }
  private checkCache() {
    if (Animator.animationType !== 'requestVideoFrameCallback') {
      let needCacheFrameCount = MCache.videoDurationTime * VideoEntity.fps * this.requestAnimationFramePercent
      //防止边界问题导致经常删除缓存
      needCacheFrameCount = Math.round(needCacheFrameCount)
      const cacheItem = MCache.caches[this.storeName] || {}
      logger.debug(
        '[mCache]',
        '[checkCache] 当前缓存帧数',
        Object.keys(cacheItem).length,
        '需要缓存帧数',
        needCacheFrameCount,
      )
      if (cacheItem && Object.keys(cacheItem).length < needCacheFrameCount) {
        this.removeCacheItem(this.storeName)
        logger.debug('[mCache]', '[checkCache removeCacheItem]', this.storeName)
      }
    }
  }
  //TODO 定制批量删除策略
  removeCache() {
    //超过 frameCacheCount 删除
    if (MCache.cacheKeys.length > this.frameCacheCount) {
      const resetCount = MCache.cacheKeys.length - this.frameCacheCount
      for (let i = 1; i < resetCount; i++) {
        const key = MCache.cacheKeys.shift()
        // logger.debug('[removeCache]', key, MCache.cacheKeys)
        this.removeCacheItem(key)
        logger.debug('[mCache]', '[removeCache]', '达到视频缓存总数删除', key)
      }
    }
  }
  removeCacheItem(key) {
    if (MCache.caches[key]) {
      delete MCache.caches[key]
      MCache.caches[key] = {}
    }
    const cacheKeyIndex = MCache.cacheKeys.indexOf(key)
    if (cacheKeyIndex > -1) {
      MCache.cacheKeys.splice(cacheKeyIndex, 1)
    }
    // canvas remove
    /*
    let canvas = MCache.cachesOfs[key]
    if (canvas) {
      if (canvas instanceof HTMLCanvasElement) {
        canvas.remove()
        canvas = undefined
      } else {
        MCache.cachesOfs[key] = undefined
      }
    }*/
  }
  public videoSeekedEvent() {
    this.checkCache()
    this.setAnimationStatus()
  }
  public destory() {
    logger.debug('[mCache]', '[destory]')
    this.removeCache()
    this.checkCache()
  }
}
