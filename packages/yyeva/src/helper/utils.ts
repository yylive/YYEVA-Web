/**
 * 判断链接是否 dataUrl (base64)
 * @param url
 * @returns boolean
 */
export const isDataUrl = (url: string) => {
  const regex =
    /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i
  return regex.test(url)
}
const currentVideoId = Date.now()
export const getVIdeoId = (url, isWeixin: boolean) => {
  return !isWeixin ? url : `e-video-wx-${currentVideoId}`
}
