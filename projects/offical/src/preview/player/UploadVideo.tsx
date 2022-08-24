import {useState, useEffect, useRef} from 'react'
import {useVideoFormStore, useVideoStore} from 'src/preview/store/usePlayerStore'

const UploadVideo = ({children}: any) => {
  const uploadRef = useRef<HTMLDivElement>(null)
  const uploadLabelRef = useRef<HTMLLabelElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const {setVideo} = useVideoStore(state => state)
  const {setVideoFormItem} = useVideoFormStore(state => state)

  const handleDrag = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }
  const setVideoData = (d: any) => {
    setVideo(d)
    setVideoFormItem({})
    setTimeout(() => {
      setVideoFormItem({videoUrl: d.videoUrl})
    }, 0)
  }
  const handleDrop = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0]
      setVideoData({videoFile: f, videoUrl: f.name})
      // console.log('{videoFile: f, videoUrl: f.name}', {videoFile: f, videoUrl: f.name})
    }
  }
  const handleChange = (e: any) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setVideoData({videoFile: f, videoUrl: f.name})
    }
  }
  useEffect(() => {
    if (!formRef.current || !uploadLabelRef.current || !fileInputRef.current) return
  }, [])
  return (
    <>
      <form ref={formRef} onDragEnter={handleDrag} onSubmit={e => e.preventDefault()}>
        <label className="drapUpload" htmlFor="input-file-upload" ref={uploadLabelRef}>
          {children}
        </label>
        <input
          id="input-file-upload"
          style={{display: 'none'}}
          type="file"
          ref={fileInputRef}
          multiple={false}
          onChange={handleChange}
        />
        {dragActive && (
          <div
            className="drag-file-element"
            ref={uploadRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          ></div>
        )}
      </form>
    </>
  )
}
export default UploadVideo
