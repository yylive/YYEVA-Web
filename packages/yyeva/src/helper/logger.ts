import config from 'src/helper/config'
import type EVideo from 'src/player'
import type {MixEvideoOptions} from 'src/type/mix'
const prefixName = 'YYEVA'
export type ConsoleFn = (message?: any, ...optionalParams: any[]) => void
export type LogTypes = 'debug' | 'info' | 'warn' | 'error'
export type LogParams = {
  level?: LogTypes
  channel?: string
  showtips?: boolean
}
export class Logger {
  warn: ConsoleFn
  error: ConsoleFn
  debug: ConsoleFn
  info: ConsoleFn
  log: ConsoleFn
  op: Required<LogParams> = {
    level: 'debug',
    channel: '',
    showtips: true,
  }
  private colors = {
    debug: '#3498db',
    info: '#16a085',
    warn: '#e67e22',
    error: '#e74c3c',
  }
  private levels = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
  }
  private logType(type: LogTypes) {
    const s = type.toLocaleUpperCase()
    let rs: any[] = []
    if (this.op.showtips)
      rs = [
        `%c ${this.op.channel || prefixName} %c ${s} `,
        `background:#2c3e50;color:#fff;padding: 1px;border-radius: 2px 0 0 2px;`,
        `background:${this.colors[type]};color: #fff;padding: 1px; border-radius: 0 2px 2px 0;`,
      ]
    return rs
  }
  constructor() {}
  setup(options?: LogParams) {
    const {channel, level, showtips} = (self as any).LoggerConfig || {}
    this.op = {...this.op, ...options}
    if (typeof showtips === 'boolean') this.op.showtips = showtips
    const lv = level ? this.levels[level] : this.op.level ? this.levels[this.op.level] : config.mode === 'dev' ? 1 : 2
    // console.log(lv,config)
    const useChannel = !channel || channel === this.op.channel
    const silenceFn = (...args: any[]) => {
      //:TODO 增加上报逻辑
      // console.log(...args)
    }
    this.error = lv <= 4 && useChannel ? console.error.bind(console, ...this.logType('error')) : silenceFn
    this.warn = lv <= 3 && useChannel ? console.warn.bind(console, ...this.logType('warn')) : silenceFn
    this.info = lv <= 2 && useChannel ? console.log.bind(console, ...this.logType('info')) : silenceFn
    this.log = lv <= 2 && useChannel ? console.log.bind(console, ...this.logType('info')) : silenceFn
    this.debug = lv <= 1 && useChannel ? console.log.bind(console, ...this.logType('debug')) : silenceFn
  }
}
// window.LoggerConfig = {
//   level: 'warn',
//   channel: 'LoggerTsx',
//   showtips: false,
// }
export const logger = new Logger()
// 全局引用
export default logger

// version
export const versionTips = (op: MixEvideoOptions, player: EVideo) => {
  if (op.showPlayerInfo === 'table') {
    return console.table({
      Version: config.version,
      RenderType: op.renderType === 'canvas2d' ? op.renderType : `WebGL.${player.webglVersion}`,
      FPS: player.fps,
      DisplayMode: op.mode,
      LoadType: op.usePrefetch ? ' MSE' : 'src',
      OffScreenRender: !!op.useOfsRender,
      UseFrameCache: !!op.useFrameCache,
      UseVideoDBCache: !!op.useVideoDBCache,
      AnimationType: player.animationType,
      //
    })
  }
  console.log('player', player.renderType)
  console.log(
    `%c ${prefixName} ${config.version} %c ${player.renderType}${player.webglVersion ? player.webglVersion : ''}${self.devicePixelRatio ? ` DPR.${self.devicePixelRatio}` : ''}${` FPS.${player.fps}`}${
      op.mode ? ` ${op.mode}` : ''
    }${op.isHevc ? ' H265' : ' H264'}${op.usePrefetch ? ' MSE' : ''}${op.useOfsRender ? ' OfsRender' : ''}${
      op.useFrameCache ? ` FrameCache` : ''
    }${op.useVideoDBCache ? ` VideoCache` : ''}${
      // op.useAccurate && 'requestVideoFrameCallback' in HTMLVideoElement.prototype ? ' Accurate' : ''
      ` ${player.animationType}`
    } %c`,
    'background:#34495e ; padding: 1px; border-radius: 2px 0 0 2px;  color: #fff',
    'background:#16a085 ; padding: 1px; border-radius: 0 2px 2px 0;  color: #fff',
    'background:transparent',
  )
}
