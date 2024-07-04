import {QuestionCircleOutlined} from '@ant-design/icons'
import {ProForm, type ProFormInstance, ProFormRadio, ProFormSwitch} from '@ant-design/pro-components'
import {Tooltip, message} from 'antd'
import {useEffect, useRef} from 'react'
import {useVideoStore} from 'src/preview/store/usePlayerStore'
const swithColSpan = {xs: 8, sm: 12, md: 12, lg: 12}
const VideoOptionsForm = () => {
  const {video, setVideo} = useVideoStore()
  const formRef = useRef<ProFormInstance>()
  useEffect(() => {
    if (!formRef) return
    formRef.current?.setFieldsValue(video)
  }, [video])
  return (
    <ProForm
      formRef={formRef}
      layout="horizontal"
      grid={true}
      rowProps={{
        gutter: [16, 0],
      }}
      onFinish={async (v: any) => {
        setVideo(v)
        message.success('配置更新成功！')
      }}
      // request={async () => options}
    >
      <ProFormRadio.Group
        name="mode"
        label="模式"
        radioType="button"
        colProps={{
          xs: 12,
          sm: 24,
          md: 24,
          lg: 24,
        }}
        fieldProps={{
          // buttonStyle: 'solid',
          size: 'small',
        }}
        options={[
          {
            label: '竖屏',
            value: 'AspectFill',
          },
          {
            label: '横屏',
            value: 'AspectFit',
          },
          {
            label: '满屏',
            value: 'Fill',
          },
        ]}
      />
      <ProFormRadio.Group
        name="renderType"
        label={
          <Tooltip title="webgpu 目前在beta状态">
            渲染 <QuestionCircleOutlined />
          </Tooltip>
        }
        radioType="button"
        // initialValue={options.renderType}
        colProps={{
          xs: 12,
          sm: 24,
          md: 24,
          lg: 24,
        }}
        fieldProps={{
          size: 'small',
        }}
        // options={['webgl', 'canvas2d']}
        valueEnum={{
          webgl: 'WebGL',
          canvas2d: '2D',
          webgpu: 'GPU',
        }}
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        name="mute"
        label="静音"
        // initialValue={options.mute}
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.loop}
        name="loop"
        label="循环"
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.useAccurate}
        name="useAccurate"
        label="帧同步"
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.useFrameCache}
        name="useFrameCache"
        label="帧缓存"
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.useVideoDBCache}
        name="useVideoDBCache"
        label="本地存储"
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.forceBlob}
        name="forceBlob"
        label="强制blob"
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.showVideo}
        name="showVideo"
        label="显示MP4"
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.showPlayerInfo}
        name="showPlayerInfo"
        label="播放信息"
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.checkTimeout}
        name="checkTimeout"
        label={
          <Tooltip title="支持小程序、H5等后台运行程序的切换，正常播放不会停止">
            超时检查 <QuestionCircleOutlined />
          </Tooltip>
        }
      />
      <ProFormSwitch
        colProps={swithColSpan}
        fieldProps={{
          size: 'small',
        }}
        // initialValue={options.useMetaData}
        name="useMetaData"
        label={
          <Tooltip title="支持内嵌自定义内容、只需要 alphaDirection 的可关闭提升性能">
            带Key视频 <QuestionCircleOutlined />
          </Tooltip>
        }
      />
      <ProFormRadio.Group
        name="alphaDirection"
        label={
          <Tooltip title="视频Alpha素材，默认为右边，带Key素材不需要设置,useMetaData 为 false 生效">
            alpha位置 <QuestionCircleOutlined />
          </Tooltip>
        }
        radioType="button"
        colProps={{
          xs: 8,
          sm: 24,
          md: 24,
          lg: 24,
        }}
        fieldProps={{
          size: 'small',
        }}
        valueEnum={{
          left: '左',
          right: '右',
        }}
      />
      <ProFormRadio.Group
        name="logLevel"
        label="日志"
        radioType="button"
        // initialValue={options.logLevel}
        colProps={{
          xs: 16,
          sm: 24,
          md: 24,
          lg: 24,
        }}
        fieldProps={{
          size: 'small',
        }}
        options={['debug', 'info', 'warn', 'error']}
      />
    </ProForm>
  )
}
const VideoOptions = () => {
  return <VideoOptionsForm />
}
export default VideoOptions
