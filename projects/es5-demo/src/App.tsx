import {Suspense, lazy, useEffect} from 'react'
import {wechatPolyfill} from 'yyeva'
wechatPolyfill.initVideoIDPosition(['yyeva_right_top_position', 'yyeva_full_screen_position'])
const Contaner = lazy(() => import('./Container'))
const App = () => {
  return (
    <>
      <Suspense fallback={<>loading...</>}>
        <Contaner />
      </Suspense>
    </>
  )
}
export default App
