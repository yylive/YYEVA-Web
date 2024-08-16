import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileImageOutlined,
  FileOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {ProForm, type ProFormInstance, ProFormText} from '@ant-design/pro-components'
import {Divider, Table, Tooltip, message} from 'antd'
import {Fragment, useEffect, useRef} from 'react'
import {useEffectStore, usePlayerInfoStore, useVideoFormStore, useVideoStore} from 'src/preview/store/usePlayerStore'
import type {YYEvaOptionsType} from 'yyeva'
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
    const data: any = {...videoFormItem}
    // console.log('videoFormItem=', videoFormItem)
    for (const [key, value] of Object.entries(videoFormItem)) {
      if (typeof value === 'object') {
        const text = (value as any)?.text
        if (typeof text === 'string') {
          data[key] = text
        }
      }
    }
    formRef.current?.setFieldsValue(data)
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
                    // <Tooltip placement="topLeft" title={`点击上传 或 输入URL`}>
                    //   <UploadOutlined onClick={() => inputRefs[v.effectTag].click()} />
                    // </Tooltip>
                    <FileImageOutlined />
                  ),
                  addonAfter: (
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
const PlayerInfo = () => {
  const playerInfo = usePlayerInfoStore(state => state.playerInfo) as YYEvaOptionsType
  const dataSource = [
    {
      key: '1',
      name: '渲染引擎',
      val: <b>{(playerInfo.renderType as string).toUpperCase()}</b>,
    },
    {
      key: '2',
      name: '高刷',
      val: playerInfo.useAccurate ? (
        <CheckCircleOutlined style={{color: 'green'}} />
      ) : (
        <CloseCircleOutlined style={{color: 'red'}} />
      ),
    },
    {
      key: '3',
      name: 'FPS',
      val: <b>{playerInfo.fps}</b>,
    },
  ]

  const columns = [
    {
      title: '选项',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '配置',
      dataIndex: 'val',
      key: 'val',
    },
  ]

  return <Table dataSource={dataSource} columns={columns} pagination={false} />
}
const VideoMeta = () => {
  // const {videoFormItem}: any = useVideoFormStore(state => state)
  // return <>{videoFormItem.videoUrl ? <VideoForm /> : <Spin tip="Loading..." />}</>
  return (
    <>
      <VideoForm />
      <Divider />
      <PlayerInfo />
    </>
  )
}
export default VideoMeta
