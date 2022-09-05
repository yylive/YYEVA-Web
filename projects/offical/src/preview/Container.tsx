import {PageContainer} from '@ant-design/pro-layout'
import {ProCard, ProForm, ProFormText, ProFormRadio, ProFormSwitch, ProFormSelect} from '@ant-design/pro-components'
// import {Row, Col, Space} from 'antd'
import {GiftPlayer} from './player'
import VideoOptions from 'src/preview/player/VideoOptions'
import {version} from 'yyeva'
import VideoMeta from './player/VideoMeta'
import {useEffectStore, useOptionsStore} from 'src/preview/store/usePlayerStore'
import {DashboardOutlined, GithubOutlined, SmileOutlined, SmileFilled, PlusCircleOutlined} from '@ant-design/icons'
import {Badge, Card, Typography, Row, Col, Avatar} from 'antd'
import SelectVideo from './player/SelectVideo'
import Author from './view/Author'
import WhoUse from './view/WhoUse'
import GitHubButton from 'react-github-btn'
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
  const {options} = useOptionsStore(state => state)
  return (
    <PageContainer
      subTitle="YY Effect Video Animate"
      // content={<Content />}
      title={
        <>
          <img className="logo" src="/logo.png" />
          YYEVA
        </>
      }
    >
      <ProCard gutter={8} wrap ghost size="default" split={'vertical'}>
        <ProCard
          style={{marginTop: 8, height: '100%'}}
          colSpan={{xs: 24, sm: 6, md: 6, lg: 6}}
          title="描述信息 Meta"
          headerBordered
          loading={effect.effect && Object.keys(effect.effect).length === 0}
        >
          <SelectVideo />
          <br />
          <VideoMeta />
        </ProCard>

        <ProCard
          style={{marginTop: 8, height: '100%'}}
          colSpan={{xs: 24, sm: 12, md: 12, lg: 12}}
          title={<>预览 Preview</>}
          extra={
            <GitHubButton
              href="https://github.com/yylive/YYEVA"
              data-color-scheme="no-preference: light; light: light; dark: dark;"
              data-size="large"
              data-show-count="true"
              aria-label="Star yylive/YYEVA on GitHub"
            >
              Star
            </GitHubButton>
          }
          layout="center"
          headerBordered
        >
          <Badge.Ribbon text={<>v{version}</>}>
            <GiftPlayer />
          </Badge.Ribbon>
        </ProCard>
        <ProCard
          style={{marginTop: 8, height: '100%'}}
          colSpan={{xs: 24, sm: 6, md: 6, lg: 6}}
          title="配置 Config"
          extra={
            <Typography.Paragraph
              style={{margin: 0}}
              copyable={{
                text: `${JSON.stringify(options, null, 2)}`,
                // icon: [<SmileOutlined key="copy-icon" />, <SmileFilled key="copied-icon" />],
                tooltips: ['点击复制', '复制成功'],
              }}
            >
              复制配置
            </Typography.Paragraph>
          }
          headerBordered
        >
          <VideoOptions />
        </ProCard>
      </ProCard>

      <ProCard title="Power By" style={{marginTop: '24px'}} gutter={8} wrap ghost size="default" split={'vertical'}>
        <Author />
      </ProCard>
      <ProCard
        title="Who Use"
        extra={
          <a href="https://github.com/yylive/YYEVA/issues/7" target="_blank" rel="noreferrer">
            更多
          </a>
        }
        style={{marginTop: '24px'}}
        gutter={8}
        wrap
        ghost
        size="default"
        split={'vertical'}
      >
        <WhoUse />
      </ProCard>
    </PageContainer>
  )
}
export default Page
