import {Segmented, Typography, Tooltip} from 'antd'
import {
  DashboardOutlined,
  BellOutlined,
  RightSquareOutlined,
  UpSquareOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
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
  hevc: {
    videoUrl: `${host}/yy/fh-264.mp4`,
    hevcUrl: `${host}/yy/fh-265.mp4`,
    effects: {
      anchor_nick: `凤凰坐骑进场秀`,
    },
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
          {
            label: (
              <Tooltip title="默认">
                <DashboardOutlined />
              </Tooltip>
            ),
            value: 'default',
          },
          {
            label: (
              <Tooltip title="音频">
                <BellOutlined />
              </Tooltip>
            ),
            value: 'music',
          },
          {
            label: (
              <Tooltip title="HEVC、H265">
                <ThunderboltOutlined />
              </Tooltip>
            ),
            value: 'hevc',
          },
          {
            label: (
              <Tooltip title="竖屏">
                <UpSquareOutlined />
              </Tooltip>
            ),
            value: 'aspectFill',
          },
          {
            label: (
              <Tooltip title="横屏">
                <RightSquareOutlined />
              </Tooltip>
            ),
            value: 'aspectFit',
          },
        ]}
      />
    </div>
  )
}
export default SelectVideo
