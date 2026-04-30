import logger from 'src/helper/logger'
export function getVideoByHttp(videoSource: string) {
  return new Promise((resolve, reject) => {
    fetch(videoSource)
      .then(r => {
        if (r.ok) {
          resolve(r.blob())
        } else {
          const err = new Error('fetch request failed, url: ' + videoSource)
          logger.error(err.message)
          reject(err)
        }
      })
      .catch(err => {
        logger.error('getVideoByHttp fetch, err=', err)
        reject(err)
      })
  })
}
