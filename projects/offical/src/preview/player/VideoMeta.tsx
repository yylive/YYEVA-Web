import {useEffectStore} from 'src/preview/store/usePlayerStore'
const VideoMeta = () => {
  const effect = useEffectStore(state => state)
  //   console.log('effect.data', effect.data)
  return (
    <>
      <pre>{JSON.stringify(effect.effect, null, 2)}</pre>
    </>
  )
}
export default VideoMeta
