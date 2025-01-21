import logger from 'src/helper/logger'
export function getVideoByHttp(videoSource: string) {
  return new Promise((resolve, reject) => {
    fetch(videoSource)
      .then(r => {
        if (r.ok) {
          resolve(r.blob())
        } else {
          logger.error('fetch request failed, url: ' + this.op.videoSource)
          return undefined
        }
      })
      .catch(err => {
        logger.error('getVideoByHttp fetch, err=', err)
        return undefined
      })
  })
}
