import {useEffectStore, useVideoStore} from 'src/preview/store/usePlayerStore'
import {ProCard, ProForm, ProFormText, ProFormRadio, ProFormSwitch, ProFormSelect} from '@ant-design/pro-components'
import {FileOutlined, FileImageOutlined, ApiOutlined} from '@ant-design/icons'
import {message} from 'antd'
const VideoMeta = () => {
  const {effect, setEffect} = useEffectStore(state => state)
  const {video, setVideo} = useVideoStore(state => state)
  const videoEffect: any = video.effects
  //   console.log('effect.data', effect.data)
  return (
    <ProForm
      layout="horizontal"
      grid={true}
      rowProps={{
        gutter: [16, 0],
      }}
      onFinish={async (v: any) => {
        console.log('VideoMeta', v)
        const videoUrl = v.videoUrl
        delete v.videoUrl
        const videoItem = {
          videoUrl,
          effects: v,
        }
        setVideo(videoItem)
        message.success('描述更新成功！')
      }}
    >
      <ProFormText
        name="videoUrl"
        placeholder="video url"
        initialValue={video.videoUrl}
        fieldProps={{
          prefix: <ApiOutlined />,
        }}
      />
      {effect.map((v: any) => {
        return (
          <ProFormText
            key={v.effectTag}
            name={v.effectTag}
            placeholder={v.effectTag}
            fieldProps={{
              prefix: v.effectType === 'txt' ? <FileOutlined /> : <FileImageOutlined />,
            }}
            initialValue={videoEffect[v.effectTag]}
          />
        )
      })}
      {/* <pre>{JSON.stringify(effect, null, 2)}</pre> */}
    </ProForm>
  )
}
export default VideoMeta
