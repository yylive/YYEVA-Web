import {yyEva, YYEvaType, version} from 'yyeva'
import Version from 'src/components/version/version'

import sm from './preview.module.scss'
const Preview = () => {
  return (
    <div className={sm.wrap}>
      <Version version={version} />
    </div>
  )
}

export default Preview
