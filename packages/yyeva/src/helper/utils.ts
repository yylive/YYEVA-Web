import {polyfill} from './polyfill'
/**
 * 判断链接是否 dataUrl (base64)
 * @param url
 * @returns boolean
 */
export const isDataUrl = (url: string | HTMLInputElement) => {
  if (url instanceof HTMLInputElement) return false
  const regex =
    /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i
  return regex.test(url)
}
const currentVideoId = Date.now()
export const getVIdeoId = url => {
  if (polyfill.weixin) return `e-video-wx-${currentVideoId}`
  // if (polyfill.quark) return `quark_${Math.round(Math.random() * 1000)}_${url}`
  else return url
}
