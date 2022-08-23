import {ProCard, ProForm, ProFormText, ProFormRadio, ProFormSwitch, ProFormSelect} from '@ant-design/pro-components'
import {useOptionsStore} from 'src/preview/store/usePlayerStore'
import {message} from 'antd'
const VideoOptions = () => {
  const {options, setOptions} = useOptionsStore()
  return (
    <ProForm
      layout="horizontal"
      grid={true}
      rowProps={{
        gutter: [16, 0],
      }}
      onFinish={async (v: any) => {
        // console.log('options submit', v)
        setOptions(v)
        message.success('配置更新成功！')
      }}
    >
      <ProFormRadio.Group
        name="mode"
        label="模式"
        radioType="button"
        initialValue={options.mode}
        colProps={{
          span: 24,
        }}
        fieldProps={{
          // buttonStyle: 'solid',
          size: 'small',
        }}
        options={[
          {
            label: 'AspectFill',
            value: 'AspectFill',
          },
          {
            label: 'AspectFit',
            value: 'AspectFit',
          },
          {
            label: 'Fill',
            value: 'Fill',
          },
        ]}
      ></ProFormRadio.Group>
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        name="mute"
        label="静音"
        initialValue={options.mute}
      />
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        initialValue={options.loop}
        name="loop"
        label="循环"
      />
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        initialValue={options.useMetaData}
        name="useMetaData"
        label="带Key视频"
      />
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        initialValue={options.useAccurate}
        name="useAccurate"
        label="帧同步"
      />
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        initialValue={options.useFrameCache}
        name="useFrameCache"
        label="帧缓存"
      />
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        initialValue={options.useVideoDBCache}
        name="useVideoDBCache"
        label="本地存储"
      />
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        initialValue={options.forceBlob}
        name="forceBlob"
        label="强制blob"
      />
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        initialValue={options.showVideo}
        name="showVideo"
        label="显示MP4"
      />
      <ProFormSwitch
        colProps={{
          span: 12,
        }}
        fieldProps={{
          size: 'small',
        }}
        initialValue={options.showPlayerInfo}
        name="showPlayerInfo"
        label="显示播放信息"
      />
      <ProFormRadio.Group
        name="logLevel"
        label="日志"
        radioType="button"
        initialValue={options.logLevel}
        colProps={{
          span: 24,
        }}
        fieldProps={{
          // buttonStyle: 'solid',
          size: 'small',
        }}
        options={['debug', 'info', 'warn', 'error']}
      />
    </ProForm>
  )
}
export default VideoOptions
