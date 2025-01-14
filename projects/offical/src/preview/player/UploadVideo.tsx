import {useEffect, useRef, useState} from 'react'
import {useClickUploadStore, useVideoFormStore, useVideoStore} from 'src/preview/store/usePlayerStore'
export type UploadVideoType = {
  // fileInputRef: React.RefObject<HTMLInputElement>
  children: React.ReactNode
}
const UploadVideo = ({children}: UploadVideoType) => {
  const uploadRef = useRef<HTMLDivElement>(null)
  const uploadLabelRef = useRef<HTMLLabelElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const {setVideo} = useVideoStore(state => state)
  const {setVideoFormItem} = useVideoFormStore(state => state)
  const {upload} = useClickUploadStore(state => state)

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
      setVideoData({videoUrl: f})
    }
  }
  const handleChange = (e: any) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      setVideoData({videoUrl: f})
    }
  }
  useEffect(() => {
    if (!formRef.current || !uploadLabelRef.current || !fileInputRef.current) return
  }, [])
  useEffect(() => {
    console.log('upload', upload)
    fileInputRef.current?.click()
  }, [upload])
  return (
    <>
      <form ref={formRef} onDragEnter={handleDrag} onSubmit={e => e.preventDefault()}>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label className="drapUpload" ref={uploadLabelRef}>
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
