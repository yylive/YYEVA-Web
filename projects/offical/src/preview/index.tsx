import Layout from './Layout'
// import 'antd/dist/antd.min.css'
import './common.css'
import Jcx from './view/Jcx'
import {videoUrl} from './config/video'

const Privew = () => (
  <>
    <Layout />
    {!videoUrl && <Jcx />}
  </>
)
export default Privew
