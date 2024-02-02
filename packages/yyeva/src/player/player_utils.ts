import logger from 'src/helper/logger'
export function getVideoByHttp(videoSource: string) {
  return new Promise(async (resolve, reject) => {
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

    resolve(blob)

    //   const xhr = new XMLHttpRequest()
    //   xhr.open('GET', this.op.videoSource, true)
    //   xhr.responseType = 'blob'
    //   xhr.onload = () => {
    //     if (xhr.status === 200 || xhr.status === 304) {
    //       resolve(xhr.response)
    //     } else {
    //       reject(new Error('http response invalid' + xhr.status))
    //     }
    //   }
    // xhr.send()
  })
}
