import {logger} from 'src/helper/logger'
import parser from 'src/parser'
export const createMSE = (source: string, mimeCodec: string): Promise<string> => {
  const URL = (window as any).webkitURL || window.URL
  return new Promise((resolve, reject) => {
    if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
      const mediaSource = new MediaSource()
      //console.log(mediaSource.readyState); // closed
      const src = URL.createObjectURL(mediaSource)
      mediaSource.addEventListener('sourceopen', () => {
        const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
        logger.debug(URL)
        const xhr = new XMLHttpRequest()
        xhr.open('get', source)
        xhr.responseType = 'arraybuffer'
        xhr.onload = () => {
          sourceBuffer.addEventListener('updateend', _ => {
            mediaSource.endOfStream()
            logger.debug(mediaSource.readyState) // ended
          })
          sourceBuffer.appendBuffer(xhr.response)
        }
        xhr.send()
      })
      resolve(src)
      logger.debug('blob', src)
    } else {
      logger.error('Unsupported MSE: Unsupported MIME type or codec ', mimeCodec)
      const sUserAgent = navigator.userAgent.toLowerCase()
      if (sUserAgent.indexOf('baidu') > 0) {
        /**
         * 百度浏览内核,不支持 src="blob" 播放
         * 不走 blob，直接返回 url
         */
        resolve(source)
      } else {
        /**
         * 请求视频 resp 转 blob
         */
        const xhr = new XMLHttpRequest()
        xhr.open('GET', source, true)
        xhr.responseType = 'blob'
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 304) {
            const res = xhr.response
            resolve(URL.createObjectURL(res))
          }
        }
        xhr.send()
      }
    }
  })
}

/**
 * IOS 创建 blob 模式
 * @param source
 * @returns
 */
type FileReaderType = {
  url: string
  data: any
}
export const fileReaderBlob = (source: string): Promise<FileReaderType> => {
  const URL = (window as any).webkitURL || window.URL
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', source, true)
    xhr.responseType = 'blob'
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 304) {
        const fileReader = new FileReader()
        fileReader.onloadend = () => {
          const resultStr = fileReader.result as string
          const data = parser.getdata(resultStr)
          const raw = atob(resultStr.slice(resultStr.indexOf(',') + 1))
          const buf = Array(raw.length)
          for (let d = 0; d < raw.length; d++) {
            buf[d] = raw.charCodeAt(d)
          }
          const arr = new Uint8Array(buf)
          const blob = new Blob([arr], {type: 'video/mp4'})
          resolve({url: URL.createObjectURL(blob), data})
        }
        fileReader.readAsDataURL(xhr.response)
      } else {
        reject(new Error('http response invalid' + xhr.status))
      }
    }
    xhr.send()
  })
}

export function prefetchVideoStream(source: string, mimeCodec: string): Promise<FileReaderType> {
  return fileReaderBlob(source)
  // ios 或者 Mac OS
  // if (/iphone|ipad|ipod/i.test(navigator.userAgent) || /macintosh|mac os x/i.test(navigator.userAgent)) {
  //   return fileReaderBlob(source)
  // }
  // //Android
  // else {
  //   return createMSE(source, mimeCodec)
  // }
}
