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
import {FileOutlined, FileImageOutlined, ApiOutlined, UploadOutlined} from '@ant-design/icons'
import {message, Spin, Tooltip} from 'antd'
import {Fragment, useEffect, useRef} from 'react'
const fileToDataUrl = (file: HTMLInputElement): Promise<string | undefined> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    if (file.files) reader.readAsDataURL(file.files[0])
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = e => reject(undefined)
  })
}
const VideoForm = () => {
  const {effect, setEffect} = useEffectStore(state => state)
  const {video, setVideo} = useVideoStore(state => state)
  const {videoFormItem} = useVideoFormStore(state => state)
  const formRef = useRef<ProFormInstance>()
  const inputRefs: any = {}
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
          return v.effectType === 'txt' ? (
            <ProFormText
              key={`${v.effectTag}_${index}_${v.effectType}`}
              name={v.effectTag}
              placeholder={v.effectTag}
              colProps={{
                xs: 12,
                sm: 24,
                md: 24,
                lg: 24,
              }}
              fieldProps={{
                prefix: <FileOutlined />,
              }}
            />
          ) : (
            <Fragment key={`input_${v.effectTag}_${index}`}>
              <input
                type="file"
                ref={ref => {
                  // console.log('ProFormText', ref)
                  if (ref) inputRefs[v.effectTag] = ref
                }}
                onChange={async e => {
                  // console.log('file input', v.effectTag, e.target.files)
                  const dataUrl = await fileToDataUrl(e.target)
                  // console.log('dataUrl', dataUrl)
                  formRef.current?.setFieldValue(v.effectTag, dataUrl)
                  // console.log(formRef)
                }}
                style={{display: 'none'}}
              />
              <ProFormText
                name={v.effectTag}
                placeholder={v.effectTag}
                colProps={{
                  xs: 12,
                  sm: 24,
                  md: 24,
                  lg: 24,
                }}
                fieldProps={{
                  prefix: (
                    <Tooltip placement="topLeft" title={`点击上传 或 输入URL`}>
                      <UploadOutlined onClick={() => inputRefs[v.effectTag].click()} />
                    </Tooltip>
                  ),
                }}
              />
            </Fragment>
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
