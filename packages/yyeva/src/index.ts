import config from 'src/helper/config'
import {logger, versionTips} from 'src/helper/logger'
import Player from 'src/player'
import {polyfill, wechatPolyfill} from './helper/polyfill'
import {isOffscreenCanvasSupported} from './helper/utils'
import type {MixEvideoOptions} from './type/mix'

const DEFAULT_OPTIONS: Partial<MixEvideoOptions> = {
  showVideo: false,
  useWorker: false,
  loop: true,
  autoplay: true,
  videoUrl: '',
  videoID: null,
  dataUrl: '',
  offset: 0,
  usePrefetch: true,
  useBitmap: true,
  useAccurate: true,
  useMetaData: false,
  alphaDirection: 'left',
  useVideoDBCache: true,
  useFrameCache: false,
  useOfsRender: false,
  resizeCanvas: 'percent',
  showPlayerInfo: true,
  forceBlob: false,
  checkTimeout: false,
  endPause: false,
  font: { overflow: 'cut' },
}

const EVENTS = ['Start', 'Stop', 'End', 'Pause', 'Resume', 'Process', 'Error'] as const

async function yyEva(options: MixEvideoOptions): Promise<Player> {
  const op = { ...DEFAULT_OPTIONS, ...options }

  // 功能特性检测与降级处理
  const featureChecks = {
    bitmap: () => self.createImageBitmap,
    offscreen: () => isOffscreenCanvasSupported() && op.useOfsRender,
    indexedDB: () => self.indexedDB,
    accurate: () => !(polyfill.android && polyfill.baidu)
  }

  if (!featureChecks.bitmap()) op.useBitmap = false
  if (!featureChecks.offscreen()) {
    op.useOfsRender = false
    op.useFrameCache = false
  }
  if (!featureChecks.indexedDB()) op.useVideoDBCache = false
  if (!featureChecks.accurate()) op.useAccurate = false

  // 特殊配置处理
  if (op.useMetaData) op.usePrefetch = true
  if (op.useFrameCache) op.useOfsRender = true

  // 日志设置
  logger.setup({level: op.logLevel, showtips: !!op.showPlayerInfo})

  // 微信环境处理
  if (polyfill.weixin && polyfill.ios) await wechatPolyfill.wxReady()

  // 创建播放器实例
  const player = new Player(op)

  // 绑定事件
  EVENTS.forEach(event => {
    const handler = op[`on${event}`]
    if (handler) player[`on${event}`] = handler
  })

  // 初始化播放器
  await player.setup()
  op.showPlayerInfo && versionTips(op, player)
  op.onGetConfig?.(op)

  return player
}

export const version = config.version
export const mode = config.mode
export {yyEva, wechatPolyfill}
export type YYEvaType = Player
export type YYEvaOptionsType = MixEvideoOptions
export default yyEva
