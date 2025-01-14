import {
  BellOutlined,
  DashboardOutlined,
  RightSquareOutlined,
  ThunderboltOutlined,
  UpSquareOutlined,
} from '@ant-design/icons'
import {Segmented, Tooltip, Typography} from 'antd'
import videos from 'src/preview/config/video'
import {useVideoStore} from 'src/preview/store/usePlayerStore'
const SelectVideo = () => {
  const {setVideo} = useVideoStore(state => state)
  return (
    <div>
      <Segmented
        block
        defaultValue="default"
        onChange={k => {
          setVideo(videos[k])
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
