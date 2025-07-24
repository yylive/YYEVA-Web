import {logger} from 'src/helper/logger'
import {getChromeVersion, isAndroid} from './polyfill'

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
// const currentVideoId = Date.now()
// export const getVIdeoId = url => {
//   // if (polyfill.weixin) return `e-video-wx-${currentVideoId}`
//   // // if (polyfill.quark) return `quark_${Math.round(Math.random() * 1000)}_${url}`
//   // else return url
//   return url
// }

export function isOffscreenCanvasSupported() {
  /**
+ Chrome browser version 4 to Chrome browser version 57 doesn't supports HTML5 OffscreenCanvas. Chrome browser version 58 to 70 does not support but can be enabled.
+ Mozilla Firefox browser version 2 to Mozilla Firefox browser version 43 doesn't supports HTML5 OffscreenCanvas property. Mozilla Firefox browser version 57 to 63 partially supports HTML5 OffscreenCanvas property and partial support for Firefox refers to supporting an older version for the web browser.
+ Internet Explorer browser version 6 to Internet Explorer browser version 11 doesn't supports HTML5 OffscreenCanvas property.
+ Safari browser version 3.1 to Safari browser version 12 doesn't supports supports HTML5 OffscreenCanvas.
+ Microsoft Edge browser version 12 to Microsoft Edge browser version 18 doesn't supports HTML5 OffscreenCanvas property.
+ Opera browser version 10.1 to Opera browser version 44 doesn't supports HTML5 OffscreenCanvas. Opera browser version 45 to Opera browser version 53 does not support but can be enabled.
   */
  if (isAndroid && getChromeVersion() <= 70) {
    return false
  }
  return typeof OffscreenCanvas !== 'undefined' && self.OffscreenCanvas
}

// Use a fake element
//https://phuoc.ng/collection/html-dom/measure-the-width-of-given-text-of-given-font/
export function getTextByMaxWidth(text: string, font: string, maxWidth: number) {
  // Create an element
  const ele = document.createElement('div')

  // Set styles
  ele.style.position = 'absolute'
  ele.style.visibility = 'hidden'
  ele.style.whiteSpace = 'nowrap'
  ele.style.left = '-9999px'

  // Set font and text
  ele.style.font = font
  ele.innerText = text

  // Append to the body
  document.body.appendChild(ele)

  let str = text
  // Get the width
  let width = window.getComputedStyle(ele).width
  logger.debug('getTextByMaxWidth width=', width)
  if (Number.parseInt(width, 10) > maxWidth) {
    let len = text.length
    while (true) {
      str = text.substring(0, len - 1) + '...'
      ele.innerText = str
      width = window.getComputedStyle(ele).width
      logger.debug('getTextByMaxWidth.. width=', width, str)
      if (Number.parseInt(width, 10) <= maxWidth) {
        break
      }
      len = len - 1
    }
  }

  // Remove the element
  document.body.removeChild(ele)

  return str
}

export function detectAudio(videoElement) {
  return new Promise(resolve => {
    const checkAudio = () => {
      // Firefox
      if (typeof videoElement.mozHasAudio !== 'undefined') {
        resolve(videoElement.mozHasAudio)
        return
      }

      // Webkit browsers
      if (typeof videoElement.webkitAudioDecodedByteCount !== 'undefined') {
        resolve(videoElement.webkitAudioDecodedByteCount > 0)
        return
      }

      // Standard method
      if (videoElement.audioTracks) {
        resolve(videoElement.audioTracks.length > 0)
        return
      }

      // 最后的兼容方案
      resolve(false)
    }

    if (videoElement.readyState >= 1) {
      checkAudio()
    } else {
      videoElement.addEventListener('loadedmetadata', checkAudio, {once: true})
    }
  })
}
