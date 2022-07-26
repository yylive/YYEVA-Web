import Player from 'src/player'
import config from 'src/helper/config'
import {MixEvideoOptions} from './type/mix'
import {versionTips, logger} from 'src/helper/logger'
import {polyfill, wxIsReady, wxReady} from './helper/polyfill'

async function yyEva(options: MixEvideoOptions): Promise<Player> {
  const op: MixEvideoOptions = {
    ...{
      showVideo: false,
      useWorker: false,
      loop: true,
      videoUrl: '',
      videoID: null,
      dataUrl: '',
      offset: 0,
      mute: true,
      usePrefetch: true,
      useBitmap: true,
      useAccurate: true,
      useMetaData: false,
      alphaDirection: 'left',
      useVideoDBCache: true,
      useFrameCache: true, // 默认为5个
      useOfsRender: false,
      resizeCanvas: 'percent',
      showPlayerInfo: true,
      forceBlob: false,
      returnVideoUrl: false,
    },
    ...options,
  }
  // useMetaData 必须启动usePrefetch
  if (op.useMetaData) {
    op.usePrefetch = true
  }
  if (op.useFrameCache) {
    op.useOfsRender = true
  }
  if (!self.createImageBitmap) {
    op.useBitmap = false
  }
  if (!self.OffscreenCanvas || !op.useOfsRender) {
    op.useOfsRender = false
    op.useFrameCache = false
  }
  if (!self.indexedDB) {
    op.useVideoDBCache = false
  }
  //
  // setLoggerLevel(op.logLevel)
  // console.log('op.logLevel',op.logLevel)
  logger.setup({level: op.logLevel, showtips: !!op.showPlayerInfo})
  //
  if (polyfill.weixin && !wxIsReady && polyfill.ios) await wxReady()
  //
  const player = new Player(op)
  //
  if (op.onStart) player.onStart = op.onStart
  if (op.onStop) player.onStop = op.onStop
  if (op.onEnd) player.onEnd = op.onEnd
  if (op.onPause) player.onPause = op.onPause
  if (op.onResume) player.onResume = op.onResume
  if (op.onProcess) player.onProcess = op.onProcess
  if (op.onError) player.onError = op.onError
  //
  await player.setup()
  op.showPlayerInfo && versionTips(op)
  if (op.onGetConfig) op.onGetConfig(op, options)
  // console.log(op)
  return player
}
export const version = config.version
export const mode = config.mode
export {yyEva}
export type YYEvaType = Player
export type YYEvaOptionsType = MixEvideoOptions
export default yyEva
