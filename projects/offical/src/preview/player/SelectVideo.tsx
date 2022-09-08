import {Segmented, Typography} from 'antd'
import {useOptionsStore, useVideoStore} from 'src/preview/store/usePlayerStore'
const host = ''
const selected: any = {
  default: {
    videoUrl: `${host}/yy/yy.mp4`,
    effects: {
      user_nick: 'girl',
      user_avatar: '/yy/1.jpeg',
      anchor_nick: 'boy',
      anchor_avatar: '/yy/2.jpeg',
    },
  },
  music: {
    videoUrl: `${host}/yy/music.mp4`,
    effects: {
      'keyname.png': 'music video',
      key: '/yy/q1.jpeg',
    },
  },
  aspectFill: {
    videoUrl: `${host}/yy/aspectFill.mp4`,
  },
  aspectFit: {
    videoUrl: `${host}/yy/aspectFit.mp4`,
  },
}
const SelectVideo = () => {
  const {setVideo} = useVideoStore(state => state)
  const {setOptions} = useOptionsStore(state => state)
  return (
    <div>
      <Segmented
        block
        defaultValue="default"
        onChange={k => {
          switch (k) {
            case 'music':
              setOptions({mute: false, mode: 'Fill'})
              break
            case 'aspectFill':
              // console.log('aspectFill')
              setOptions({mode: 'AspectFill'})
              break
            case 'aspectFit':
              setOptions({mode: 'AspectFit'})
              break
            default:
              setOptions({mode: 'Fill'})
              break
          }
          // console.log('options', options)
          setVideo(selected[k])
        }}
        options={[
          {label: '默认', value: 'default'},
          {label: '音频', value: 'music'},
          {label: '竖屏', value: 'aspectFill'},
          {label: '横屏', value: 'aspectFit'},
        ]}
      />
    </div>
  )
}
export default SelectVideo
