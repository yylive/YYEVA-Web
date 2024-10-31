import logger from 'src/helper/logger'
export function getVideoByHttp(videoSource: string) {
  return new Promise((resolve, reject) => {
    fetch(videoSource)
      .then(r => {
        if (r.ok) {
          resolve(r.blob())
        } else {
          const msg = 'fetch request failed, url: ' + videoSource
          logger.debug(msg)
          reject(msg)
        }
      })
      .catch(err => {
        logger.debug('getVideoByHttp fetch, err=', err)
        reject(err)
      })
  })
}
