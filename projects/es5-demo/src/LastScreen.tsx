import {Player} from './player'
const options = () => {
  return {
    videoUrl: '/stage2.mp4',
    loop: false,
    endPause: true, // 播放结束停留在最后一帧，好看ios支持，安卓不支持，会循环播放，需要手动停止
  }
}
const LastScreen = () => {
  return <Player playOpt={options} replay={false} />
}

export default LastScreen
