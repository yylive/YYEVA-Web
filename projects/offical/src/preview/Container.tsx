import {PageContainer} from '@ant-design/pro-layout'
import {ProCard, ProForm, ProFormText, ProFormSwitch, ProFormSelect} from '@ant-design/pro-components'
import {GiftPlayer} from './player'
import {version} from 'yyeva'
const Content = () => (
  <div>
    YYEVA（YY Effect
    VideoAnimate）是一个开源的支持可插入动态元素的MP4动效播放器解决方案，包含设计资源输出的AE插件，客户端渲染引擎，在线预览工具。
    <br />
    对比传统的序列帧的动画播放方式，具有更高的压缩率，硬解码效率更高的优点，同时支持插入动态的业务元素；对比SVGA、Lottie等播放器，支持更多的特效支持，如复杂3D效果、描边、粒子效果等，达到所见即所得的效果。
    <br />
    该方案是在透明MP4动效解决方案的基础上，做了进一步扩充，让静态的MP4资源，也能够支持插入动态的元素，关于透明MP4的相关介绍，请点击
    第二篇:透明MP4礼物 查看相关介绍。
  </div>
)
/**
    mode: 'AspectFill',
    useMetaData: true,
    loop: false,
    useFrameCache: true,
    mute: true,
 */
const Page = () => (
  <PageContainer
    subTitle="(YY Effect Video Animate)"
    // content={<Content />}
    title="YYEVA"
  >
    <ProCard gutter={8} ghost wrap>
      <ProCard
        style={{marginTop: 8}}
        colSpan={{xs: 24, sm: 8, md: 10, lg: 12}}
        title={`预览 v${version}`}
        layout="center"
        bordered
        headerBordered
      >
        <div className="playbox">
          <GiftPlayer />
        </div>
      </ProCard>
      <ProCard style={{marginTop: 8}} colSpan={{xs: 24, sm: 8, md: 10, lg: 12}} title="配置" bordered headerBordered>
        <ProForm layout="horizontal" submitter={false}>
          <ProFormSelect
            name="mode"
            valueEnum={{
              AspectFill: 'AspectFill',
              AspectFit: 'AspectFit',
              Fill: 'Fill',
              vertical: 'vertical',
              horizontal: 'horizontal',
              contain: 'contain',
              cover: 'cover',
            }}
          />
          <ProFormSwitch name="mute" label="静音" />
          <ProFormSwitch name="loop" label="循环" />
        </ProForm>
      </ProCard>
    </ProCard>
  </PageContainer>
)
export default Page
