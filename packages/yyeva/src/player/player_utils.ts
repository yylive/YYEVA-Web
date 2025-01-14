import logger from 'src/helper/logger'
export async function getVideoByHttp(videoSource: string) {
  const blob = await fetch(videoSource)
    .then(r => {
      if (r.ok) {
        return r.blob()
      } else {
        logger.error('fetch request failed, url: ' + this.op.videoSource)
        return undefined
      }
    })
    .catch(err => {
      logger.error('getVideoByHttp fetch, err=', err)
      return undefined
    })
  return blob
}
