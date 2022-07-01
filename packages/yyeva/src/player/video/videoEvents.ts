export default [
  // 'canlplaythrough',
  'playing', //开始播放
  'pause',
  // 'resume',
  'ended',
  'progress',
  'loadstart',
  'stop',
  'loadeddata',
  'ratechange',
  //
  'abort',
  'emptied',
  'error',
  'mozaudioavailable',
  'stalled',
  'suspend',
  'play', //状态是开始播放，但视频并未真正开始播放
  'waiting', //等待数据
  'canplay', //可以播放，但中途可能因为加载而暂停
  'canplaythrough', //可以流畅播放
  // 'timeupdate', //播放进度变化
  'seeked', //播放完毕进度回到起点循环播放
  'seeking', //寻找中
]
