import './common.css'
console.log('ts')
const root = document.getElementById('root')!
// const video = document.createElement('video')
// video.loop = true
// video.autoplay = true
// video.muted = true
// root?.appendChild(video)
// // video.src = `https://yyeva.yy.com/yy/h265.mp4`
// video.src = '/hevc.mp4'
// video.addEventListener('loadedmetadata', e => {
//   console.log(e)
// })
// video.play()

import yyEva from 'yyeva'

yyEva({
  container: root,
  mute: true,
  videoUrl: '/music.mp4',
  mode: 'AspectFill',
  useMetaData: true,
})
