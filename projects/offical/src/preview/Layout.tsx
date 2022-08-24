import BasicLayout, {BasicLayoutProps} from '@ant-design/pro-layout'
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
      Released under the Apache-2.0 License. <br />
      Copyright © 2022 YYEVA. All rights reserved. <br />
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
