export class WebGPUBase {
  public video!: HTMLVideoElement
  public canvas!: HTMLCanvasElement
  public context!: GPUCanvasContext
  public adapter: GPUAdapter | null = null
  public device: GPUDevice | null = null
  public presentationFormat!: GPUTextureFormat
  async setup() {
    await this.createCanvas()
    this.createMP4()
  }
  private async createCanvas() {
    this.adapter = await navigator.gpu.requestAdapter()
    if (!this.adapter) return
    this.device = await this.adapter.requestDevice()
    if (!this.device) {
      console.error('need a browser that supports WebGPU')
      return
    }
    this.canvas = document.createElement('canvas')
    this.setSizeCanvas(this.canvas)
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext
    //
    // const devicePixelRatio = window.devicePixelRatio
    // this.canvas.width = this.canvas.clientWidth * devicePixelRatio
    // this.canvas.height = this.canvas.clientHeight * devicePixelRatio
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat()

    this.context.configure({
      device: this.device,
      format: presentationFormat,
      //   alphaMode: 'premultiplied',
    })
    //
    const root = document.getElementById('emp-root')!
    root.appendChild(this.canvas)
    //
    this.presentationFormat = presentationFormat
  }
  private setSizeCanvas(canvas: HTMLCanvasElement, resizeCanvas = 'percent') {
    switch (resizeCanvas) {
      case 'percent':
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        break
      case 'percentH':
        canvas.style.height = '100%'
        break
      case 'percentW':
        canvas.style.width = '100%'
        break
      default:
        break
    }
  }
  private createMP4() {
    const video = document.createElement('video')
    video.muted = true
    video.loop = true
    video.preload = 'auto'
    video.src = '/af.mp4'
    // video.src = '/pano.webm'
    this.video = video
  }
  private getScale() {
    let scaleX = 1
    let scaleY = 1
    const mode: string = 'AspectFill'
    if (this.video && mode) {
      const ofs = this.canvas
      const canvasAspect = ofs.clientWidth / ofs.clientHeight
      const videoAspect = ofs.width / ofs.height

      switch (mode) {
        case 'AspectFill':
        case 'vertical': //fit vertical | AspectFill 竖屏
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          break
        case 'AspectFit':
        case 'horizontal': //fit horizontal | AspectFit 横屏
          scaleX = 1
          scaleY = canvasAspect / videoAspect
          break
        case 'contain':
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          if (scaleX > 1) {
            scaleY = 1 / scaleX
            scaleX = 1
          }
          break
        case 'Fill':
        case 'cover':
          scaleY = 1
          scaleX = videoAspect / canvasAspect
          if (scaleX < 1) {
            scaleY = 1 / scaleX
            scaleX = 1
          }
          break
      }
    }
    return [scaleX, scaleY]
  }
}
