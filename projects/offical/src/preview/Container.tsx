import {PageContainer} from '@ant-design/pro-layout'
import {ProCard, ProForm, ProFormText, ProFormRadio, ProFormSwitch, ProFormSelect} from '@ant-design/pro-components'
// import {Row, Col, Space} from 'antd'
import {GiftPlayer} from './player'
import VideoOptions from 'src/preview/player/VideoOptions'
import {version} from 'yyeva'
import VideoMeta from './player/VideoMeta'
import {useEffectStore} from 'src/preview/store/usePlayerStore'
import {DashboardOutlined} from '@ant-design/icons'
/* const Content = () => (
  <div>
    YYEVA（YY Effect
    VideoAnimate）是一个开源的支持可插入动态元素的MP4动效播放器解决方案，包含设计资源输出的AE插件，客户端渲染引擎，在线预览工具。
    <br />
    对比传统的序列帧的动画播放方式，具有更高的压缩率，硬解码效率更高的优点，同时支持插入动态的业务元素；对比SVGA、Lottie等播放器，支持更多的特效支持，如复杂3D效果、描边、粒子效果等，达到所见即所得的效果。
    <br />
    该方案是在透明MP4动效解决方案的基础上，做了进一步扩充，让静态的MP4资源，也能够支持插入动态的元素，关于透明MP4的相关介绍，请点击
    第二篇:透明MP4礼物 查看相关介绍。
  </div>
) */
/**
    mode: 'AspectFill',
    useMetaData: true,
    loop: false,
    useFrameCache: true,
    mute: true,
 */
const Page = () => {
  const effect = useEffectStore(state => state)
  return (
    <PageContainer
      subTitle="(YY Effect Video Animate)"
      // content={<Content />}
      title="YYEVA"
    >
      <ProCard gutter={8} wrap split={'vertical'}>
        <ProCard
          style={{marginTop: 8}}
          colSpan={{xs: 24, sm: 6, md: 6, lg: 6}}
          title="描述信息 Meta"
          extra={
            <a href="https://github.com/yylive/YYEVA" target="_blank" rel="noreferrer">
              {version}
            </a>
          }
          headerBordered
          loading={Object.keys(effect.effect).length === 0}
        >
          <VideoMeta />
        </ProCard>
        <ProCard
          style={{marginTop: 8}}
          colSpan={{xs: 24, sm: 12, md: 12, lg: 12}}
          title={`预览 Preview`}
          layout="center"
          headerBordered
        >
          <GiftPlayer />
        </ProCard>
        <ProCard style={{marginTop: 8}} colSpan={{xs: 24, sm: 6, md: 6, lg: 6}} title="配置 Config" headerBordered>
          <VideoOptions />
        </ProCard>
      </ProCard>
    </PageContainer>
  )
}
export default Page
