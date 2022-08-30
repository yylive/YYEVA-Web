import {useEffectStore, useVideoFormStore, useVideoStore} from 'src/preview/store/usePlayerStore'
import {
  ProCard,
  ProForm,
  ProFormText,
  ProFormRadio,
  ProFormSwitch,
  ProFormSelect,
  ProFormInstance,
} from '@ant-design/pro-components'
import {FileOutlined, FileImageOutlined, ApiOutlined} from '@ant-design/icons'
import {message, Spin} from 'antd'
import {useEffect, useRef} from 'react'
const VideoForm = () => {
  const {effect, setEffect} = useEffectStore(state => state)
  const {video, setVideo} = useVideoStore(state => state)
  const {videoFormItem} = useVideoFormStore(state => state)
  const formRef = useRef<ProFormInstance>()
  useEffect(() => {
    formRef.current?.setFieldsValue(videoFormItem)
  }, [videoFormItem])
  return (
    <ProForm
      formRef={formRef}
      layout="horizontal"
      grid={true}
      rowProps={{
        gutter: [16, 0],
      }}
      // initialValues={videoFormItem}
      // request={async () => videoFormItem}
      onFinish={async (v: any = {}) => {
        console.log('onFinish', v)
        const videoData = {...video, videoUrl: v.videoUrl}
        delete v.videoUrl
        videoData.effects = v
        setVideo(videoData)
        message.success('描述更新成功！')
      }}
    >
      <ProFormText
        name="videoUrl"
        placeholder="video url"
        fieldProps={{
          prefix: typeof video.videoUrl === 'string' ? <ApiOutlined /> : <FileImageOutlined />,
        }}
      />

      {effect &&
        effect.map((v: any, index: number) => {
          return (
            <ProFormText
              key={v.effectTag + index}
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
  // const {videoFormItem}: any = useVideoFormStore(state => state)
  // return <>{videoFormItem.videoUrl ? <VideoForm /> : <Spin tip="Loading..." />}</>
  return <VideoForm />
}
export default VideoMeta
