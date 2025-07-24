import {Player} from './player'
const options = (): any => {
  return {
    // videoUrl: '/stage2.mp4',
    // videoUrl: '/yy/yy.mp4',
    videoUrl: '/no-music.mp4',
    mute: false,
    useMetaData: true,
    loop: false,
    endPause: true, // 播放结束停留在最后一帧，好看ios支持，安卓不支持，会循环播放，需要手动停止
    showVideo: true,
    useVideoDBCache: true,
    useFrameCache: true,
    useOfsRender: false,
    usePrefetch: false,
    logLevel: 'debug',
    renderType: 'webgl',
  }
}
const LastScreen = () => {
  return <Player playOpt={options} replay={false} />
  // return <div>LastScreen</div>
}

export default LastScreen
