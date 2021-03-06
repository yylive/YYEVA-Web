import {logger} from './logger'

const ua = navigator.userAgent.toLowerCase()

export const isWeixin = ua.indexOf('micromessenger') > -1
export const isBaidu = /baidu/.test(ua)
export const isIOS = /iphone|ipad|ipod/i.test(ua)
export const isMac = /macintosh|mac os x/i.test(ua)
export const isApple = isIOS || isMac
export const isQQbrw = ua.indexOf('mqqbrowser') > -1
export const isAndroid = /android|adr/i.test(ua)
//
export const isUCBrowser = ua.indexOf('ucbrowser') > -1 // UC浏览器
export const isQuark = ua.indexOf('quark') > -1 // 夸克浏览器
// console.log('ua', ua, 'isBaidu', isBaidu)
export const polyfill = {
  baidu: isBaidu,
  weixin: isWeixin,
  apple: isApple,
  ios: isIOS,
  android: isAndroid,
  uc: isUCBrowser,
  quark: isQuark,
}

export let wxIsReady = false
export const wxReady = () =>
  new Promise(resolve => {
    document.addEventListener('WeixinJSBridgeReady', () => {
      logger.debug('WeixinJSBridgeReady')
      wxIsReady = true
      resolve(wxIsReady)
    })
  })
let tips: HTMLElement
export const wxAndroidClick = (container: HTMLElement, video: HTMLVideoElement) => {
  // alert('wxAndroidClick')
  if (!tips) {
    tips = document.createElement('div')
    tips.innerText = 'Click To Play'
    tips.style.textAlign = 'center'
    tips.style.background = 'rgba(255,255,255,0.7)'
    tips.style.position = 'absolute'
    tips.style.zIndex = '99999'
    tips.style.top = '50%'
    tips.style.left = '50%'
    tips.style.padding = '10px'
    tips.style.transform = 'translate(-50%,-50%)'
    tips.style.cursor = 'pointer'
    tips.style['border-radius'] = '5px'
    container.appendChild(tips)
  }
  // 避免 video 被注销 每次都重新生命 点击事件
  tips.onclick = () => {
    video.play()
    tips.style.display = 'none'
  }
}
