import iphone6_bg from './assets/iphone6_bg.png'
import iphone6_bg_horizontal from './assets/iphone6_bg_horizontal.png'
import iphone6_border from './assets/iphone6_border.png'
import iphone_12promax_bg from './assets/iphone-12promax_bg.png'
import iphone_12promax_bg_horizontal from './assets/iphone-12promax_bg_horizontal.png'
import iphone12promax_border from './assets/iphone12promax_border.png'
import YY_PC_1366x728 from './assets/YY-PC-1366x728.png'
import YY_PC_1920x1040 from './assets/YY-PC-1920x1040.png'

export const modeList = [`vertical`, `horizontal`, `contain`, `cover`]
export const phoneList: Record<string, any> = {
  'iPhone 6': {
    width: 750 / 2,
    height: 1334 / 2,
    background: iphone6_bg,
    backgroundH: iphone6_bg_horizontal,
    border: {
      src: iphone6_border,
      top: -118,
      left: -30,
      width: 430,
      height: 898,
      transform: 'rotate(-90deg) translateX(142px) translateY(146px)',
    },
    outsideBackground: null,
    routeSupport: true,
  },
  'iPhone 12 Pro Max': {
    width: 750 / 2,
    height: 1623 / 2,
    background: iphone_12promax_bg,
    backgroundH: iphone_12promax_bg_horizontal,
    border: {
      src: iphone12promax_border,
      top: -38,
      left: -58,
      width: 474,
      height: 898,
      transform: 'rotate(-90deg) translateX(216px) translateY(234px)',
    },
    outsideBackground: null,
    routeSupport: true,
  },
  PCYY: {
    width: 640,
    height: 711,
    background: null,
    border: null,
    outsideBackground: {
      width: 1366,
      height: 728,
      background: YY_PC_1366x728,
      left: -192,
      bottom: -80,
    },
    routeSupport: false,
  },
  'PCYY MAX': {
    width: 900,
    height: 1000,
    background: null,
    border: null,
    outsideBackground: {
      width: 1920,
      height: 1040,
      background: YY_PC_1920x1040,
      left: -380,
      bottom: -80,
    },
    routeSupport: false,
  },
}

export const exampleOption = {
  videoUrl: 'https://unpkg.yy.com/webupload/e-video/demo/previewexample.mp4',
  useMetaData: true,
  loop: true,
  mode: 'vertical',
  effects: '',
  alphaDirection: 'right',
}
