import './index.css'
import yyEva from 'yyeva'

yyEva({
  container: document.querySelector('#root')!,
  mute: true,
  autoplay: true,
  videoUrl: 'http://localhost:3000/music.mp4',
  mode: 'AspectFill',
  useMetaData: true,
  onStart(e) {
    console.log('on start')
  },
})
