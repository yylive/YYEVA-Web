import {Space, Spin} from 'antd'
import {lazy, Suspense} from 'react'
import type {RouteObject} from 'react-router-dom'
import {useRoutes, NavLink, Outlet} from 'react-router-dom'
import Layout from 'src/preview/Layout'
const App = lazy(() => import('src/preview'))

//
export const RouterConfig = (): any => {
  const routes: RouteObject[] = [
    {
      path: '/',
      element: <Layout />,
      children: [
        {index: true, element: <App />},
        {path: '*', element: <App />},
      ],
    },
  ]
  const element = useRoutes(routes)
  return element
}
const Loading = () => {
  return <Spin tip="loading......" />
}
//
export const RouterContent = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Outlet />
    </Suspense>
  )
}
