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
  title: 'YYEVA',
  headerRender: false,
  // footerRender: () => <>footer render</>,
}

const Layout = () => {
  return (
    <BasicLayout {...config}>
      <Page />
    </BasicLayout>
  )
}
export default Layout
