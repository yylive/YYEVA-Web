import {useEffectStore, useVideoFormStore, useVideoStore} from 'src/preview/store/usePlayerStore'
import {ProCard, ProForm, ProFormText, ProFormRadio, ProFormSwitch, ProFormSelect} from '@ant-design/pro-components'
import {FileOutlined, FileImageOutlined, ApiOutlined} from '@ant-design/icons'
import {message} from 'antd'
import {useState, useEffect} from 'react'
const VideoForm = () => {
  const {effect, setEffect} = useEffectStore(state => state)
  const {video, setVideo} = useVideoStore(state => state)
  const {videoFormItem} = useVideoFormStore(state => state)
  return (
    <ProForm
      layout="horizontal"
      grid={true}
      rowProps={{
        gutter: [16, 0],
      }}
      initialValues={videoFormItem}
      // request={async () => {
      //   return videoFormItem
      // }}
      onFinish={async (v: any) => {
        console.log('onFinish', v)
        setVideo(video)
        message.success('描述更新成功！')
      }}
    >
      <ProFormText
        name="videoUrl"
        placeholder="video url"
        fieldProps={{
          prefix: !video.videoFile ? <ApiOutlined /> : <FileImageOutlined />,
        }}
      />

      {effect &&
        effect.map((v: any) => {
          return (
            <ProFormText
              key={v.effectTag}
              name={v.effectTag}
              placeholder={v.effectTag}
              fieldProps={{
                prefix: v.effectType === 'txt' ? <FileOutlined /> : <FileImageOutlined />,
              }}
            />
          )
        })}
    </ProForm>
  )
}
const VideoMeta = () => {
  const {videoFormItem}: any = useVideoFormStore(state => state)
  console.log('videoFormItem', videoFormItem)
  return <>{videoFormItem.videoUrl ? <VideoForm /> : null}</>
}
export default VideoMeta
