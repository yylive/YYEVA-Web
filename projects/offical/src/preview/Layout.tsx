import {ProLayout, ProConfigProvider} from '@ant-design/pro-components'
import type {ProLayoutProps} from '@ant-design/pro-components'
// import Page from './Container'
import {RouterContent} from 'src/router/config'
import Jcx from './view/Jcx'
import './common.css'
const LogoDom = () => (
  <div className="yyeva-logo-dom">
    <img width="auto" height="22" src="/logo.png" alt="logo" />
    <h1>YYEVA</h1>
    <span className="yyeva-header-subtitle">YY Effect Video Animate</span>
  </div>
)
const config: ProLayoutProps = {
  layout: 'mix',
  contentWidth: 'Fixed',
  fixedHeader: false,
  fixSiderbar: false,
  logo: '/logo.png',
  token: {
    header: {
      // heightLayoutHeader: 108,
    },
  },
  disableMobile: false,
  menuRender: false,
  splitMenus: false,
  title: 'YYEVA - 可插入动态元素的MP4动效播放器解决方案',
  headerTitleRender: (logo, title, _) => {
    return <LogoDom />
  },
  headerRender: (props, defaultDom) => (
    <>
      <Jcx />
      <LogoDom />
    </>
  ),
  footerRender: () => (
    <div className="global-footer">
      Released under the Apache-2.0 License. <br />
      Copyright © 2022-2023 YYEVA. All rights reserved. <br />
      Site Powered by EMP 2.5、 React 18、React Router 6、Zustand、Antd 5
    </div>
  ),
}

const Layout = () => {
  return (
    <ProConfigProvider hashed={false}>
      <ProLayout {...config}>
        {/* <Page /> */}
        <RouterContent />
      </ProLayout>
    </ProConfigProvider>
  )
}
export default Layout
