import {PageContainer} from '@ant-design/pro-layout'
import {ProCard, ProForm, ProFormText, ProFormRadio, ProFormSwitch, ProFormSelect} from '@ant-design/pro-components'
// import {Row, Col, Space} from 'antd'
import {GiftPlayer} from './player'
import VideoOptions from 'src/preview/player/VideoOptions'
import {version} from 'yyeva'
import VideoMeta from './player/VideoMeta'
import {SettingOutlined} from '@ant-design/icons'
import {
  useEffectStore,
  useCodeStore,
  useClickUploadStore,
  useBackgroundColorStore,
  useBackgroundGrid,
  useVideoStore,
} from 'src/preview/store/usePlayerStore'
import {
  DashboardOutlined,
  GithubOutlined,
  SmileOutlined,
  SmileFilled,
  PlusCircleOutlined,
  CodepenOutlined,
  UploadOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import {Badge, Card, Typography, Row, Col, Avatar, Modal, Button, Tooltip, Select, Switch} from 'antd'
import SelectVideo from './player/SelectVideo'
import Platform from './view/Platform'
import Author from './view/Author'
import WhoUse from './view/WhoUse'
import GitHubButton from 'react-github-btn'
import CodePreview from './player/CodePreview'
// import Jcx from './view/Jcx'

const {Option} = Select

const GitHub: any = GitHubButton
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
  const {video} = useVideoStore(state => state)
  const {opencode, setOpenCode} = useCodeStore(state => state)
  const {setClickUpload} = useClickUploadStore()
  const {backgroundColor, setBackGoundColor} = useBackgroundColorStore(state => state)
  const {setBackGoundGrid} = useBackgroundGrid()

  const handleChange = (value: string) => {
    console.log(`selected ${value}`)
    setBackGoundColor(value)
  }

  return (
    <PageContainer
      // subTitle="YY Effect Video Animate"
      // // content={<Content />}
      // // extra={[<Jcx key={'jcx'} />]}
      // title={
      //   <>
      //     <img className="logo" src="/logo.png" />
      //     YYEVA
      //   </>
      // }
      title={false}
    >
      <ProCard gutter={8} wrap ghost size="default" split={'vertical'}>
        <ProCard
          style={{marginTop: 8, height: '100%'}}
          colSpan={{xs: 24, sm: 6, md: 6, lg: 6}}
          title="描述信息 Meta"
          // headerBordered
          loading={effect.effect && Object.keys(effect.effect).length === 0}
          extra={
            <a href="https://github.com/yylive/YYEVA-Web/tree/main/packages/yyeva" target="_blank" rel="noreferrer">
              <SettingOutlined />
            </a>
          }
        >
          <SelectVideo />
          <br />
          <VideoMeta />
        </ProCard>

        <ProCard
          style={{marginTop: 8, height: '100%'}}
          colSpan={{xs: 24, sm: 12, md: 12, lg: 12}}
          title={
            <>
              预览 Preview{' '}
              <Tooltip title="拖拉到网格 或 点击右边 上传视频">
                <QuestionCircleOutlined />
              </Tooltip>{' '}
              <Button size="small" type="primary" onClick={setClickUpload}>
                <UploadOutlined />
              </Button>{' '}
              <Select defaultValue="black" size="small" style={{width: 120}} onChange={handleChange}>
                <Option value="black">black</Option>
                <Option value="white">white</Option>
                <Option value="gray">gray</Option>
                <Option value="red">red</Option>
                <Option value="green">green</Option>
                <Option value="blue">blue</Option>
                <Option value="#9b59b6">amethyst</Option>
                <Option value="#3498db">Peter River</Option>
              </Select>{' '}
              <Switch checkedChildren="网格" unCheckedChildren="网格" defaultChecked onChange={setBackGoundGrid} />
            </>
          }
          extra={
            <GitHub
              href="https://github.com/yylive/YYEVA"
              data-color-scheme="no-preference: light; light: light; dark: dark;"
              data-size="large"
              data-show-count="true"
              aria-label="Star yylive/YYEVA on GitHub"
            >
              Star
            </GitHub>
          }
          layout="center"
          // headerBordered
        >
          <Badge.Ribbon text={<>v{version}</>}>
            <GiftPlayer backgroundColor={backgroundColor} />
          </Badge.Ribbon>
        </ProCard>
        <ProCard
          style={{marginTop: 8, height: '100%'}}
          colSpan={{xs: 24, sm: 6, md: 6, lg: 6}}
          title="配置 Config"
          extra={
            <div className="video_options_extra">
              <Tooltip title="查看代码">
                <CodepenOutlined onClick={() => setOpenCode(!opencode)} />
              </Tooltip>
              <CodePreview />
              <Typography.Paragraph
                style={{margin: 0}}
                copyable={{
                  text: `${JSON.stringify(video, null, 2)}`,
                  // icon: [<SmileOutlined key="copy-icon" />, <SmileFilled key="copied-icon" />],
                  tooltips: ['复制配置', '配置复制成功'],
                }}
              />
            </div>
          }
          // headerBordered
        >
          <VideoOptions />
        </ProCard>
      </ProCard>
      <ProCard title="Platform" style={{marginTop: '24px'}} gutter={8} wrap ghost size="default" split={'vertical'}>
        <Platform />
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
