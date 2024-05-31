import BasicLayout, {type BasicLayoutProps} from '@ant-design/pro-layout'
import Page from './Container'
//
const config: BasicLayoutProps = {
  navTheme: 'dark',
  primaryColor: '#1890ff',
  layout: 'top',
  contentWidth: 'Fixed',
  fixedHeader: true,
  fixSiderbar: true,
  logo: '/logo.png',
  // headerHeight: 48,
  menuRender: false,
  splitMenus: false,
  title: 'YYEVA - 可插入动态元素的MP4动效播放器解决方案',
  headerRender: false,
  footerRender: () => (
    <div className="global-footer">
      <p>Released under the Apache-2.0 License. </p>
      <p>Copyright © 2022~2024 YYEVA. All rights reserved. </p>
      <p className="site-info">
        Powered by{' '}
        <a href="https://github.com/ckken" target="_blank" rel="noreferrer">
          Ken
        </a>
        、Compile with{' '}
        <a href="https://empjs.dev/" target="_blank" rel="noreferrer">
          EMP v3.0
        </a>
        、 Animation Player{' '}
        <a href="https://svga.yy.com/" target={'_blank'} rel="noreferrer">
          E-SVGA
        </a>
      </p>
    </div>
  ),
}

const Layout = () => {
  return (
    <BasicLayout {...config}>
      <Page />
    </BasicLayout>
  )
}
export default Layout
