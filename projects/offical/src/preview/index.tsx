import Layout from './Layout'
// import 'antd/dist/antd.min.css'
import './common.css'
import {videoUrl} from './config/video'
import Jcx from './view/Jcx'

const Privew = () => (
  <>
    <Layout />
    {!videoUrl && <Jcx />}
  </>
)
export default Privew
