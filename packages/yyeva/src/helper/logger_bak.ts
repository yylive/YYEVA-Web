import config from 'src/helper/config'
import type {LoggerLevelType} from 'src/type/mix'
import {MixEvideoOptions} from 'src/type/mix'
import Animator from 'src/player/video/animator'
import VideoEntity from 'src/player/render/videoEntity'
import Webgl from 'src/player/render/webglEntity'
let logLevel: number
const prefixName = 'YYEVA'
// let logLevelName: string
const logNum = {
  trace: 1,
  debug: 2,
  info: 3,
  log: 3,
  time: 5,
  warn: 6,
  error: 7,
  off: 8,
}
export const getLoggerLevel = (lv: LoggerLevelType) => {
  return logNum[lv]
}
export const setLoggerLevel = (lv?: LoggerLevelType) => {
  if (lv) {
    logLevel = getLoggerLevel(lv)
    // logLevelName = lv
  } else {
    logLevel = config.mode === 'dev' ? getLoggerLevel('trace') : getLoggerLevel('info')
    // logLevelName = config.mode === 'dev' ? 'trace' : 'info'
  }
  return logLevel
}

export const versionTips = (op: MixEvideoOptions) =>
  console.log(
    `%c ${prefixName} ${config.version} %c ${op.renderType === 'canvas2d' ? op.renderType : `WebGL.${Webgl.version}`}${
      self.devicePixelRatio ? ` DPR.${self.devicePixelRatio}` : ''
    }${` FPS.${VideoEntity.fps}`}${op.mode ? ` ${op.mode}` : ''}${op.usePrefetch ? ' MSE' : ''}${
      op.useOfsRender ? ' OfsRender' : ''
    }${op.useFrameCache ? ` FrameCache` : ''}${op.useVideoDBCache ? ` VideoCache` : ''}${
      // op.useAccurate && 'requestVideoFrameCallback' in HTMLVideoElement.prototype ? ' Accurate' : ''
      ` ${Animator.animationType}`
    } %c`,
    'background:#34495e ; padding: 1px; border-radius: 2px 0 0 2px;  color: #fff',
    'background:#3498db ; padding: 1px; border-radius: 0 2px 2px 0;  color: #fff',
    'background:transparent',
  )

const log = (lv: LoggerLevelType, ...args: any[]) => {
  // console.log('log lv', lv)
  if (logLevel <= logNum[lv]) {
    if (logLevel < 3) args.unshift(`[${lv}]`)
    args.unshift(`[${prefixName}]`)

    switch (lv) {
      case 'trace':
        console.trace(...args)
        break
      case 'debug':
        console.log(...args)
        break
      case 'info':
        console.info(...args)
        break
      case 'log':
        console.log(...args)
        break
      case 'time':
        console.time(...args)
        break
      case 'warn':
        console.warn(...args)
        break
      case 'error':
        console.error(...args)
        break
      case 'off':
        break
    }
  }
}

export const logger = {
  trace: (...args: any[]) => {
    log('trace', ...args)
  },

  debug: (...args: any[]) => {
    log('debug', ...args)
  },

  info: (...args: any[]) => {
    log('info', ...args)
  },

  log: (...args: any[]) => {
    log('log', ...args)
  },

  time: (...args: any[]) => {
    log('time', ...args)
  },

  warn: (...args: any[]) => {
    log('warn', ...args)
  },
  error: (...args: any[]) => {
    log('error', ...args)
  },
  off: (...args: any[]) => {
    log('off', ...args)
  },
}
