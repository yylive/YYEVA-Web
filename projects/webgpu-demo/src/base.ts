export class WebGPUBase {
  public video!: HTMLVideoElement
  public canvas!: HTMLCanvasElement
  public context!: GPUCanvasContext
  public adapter!: GPUAdapter
  public device!: GPUDevice
  public presentationFormat!: GPUTextureFormat
  async setup() {
    await this.createCanvas()
    this.createMP4()
  }
  private async createCanvas() {
    this.adapter = (await navigator.gpu.requestAdapter()) as GPUAdapter
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
      /**
          alphaMode 的选项
          alphaMode 主要有以下几个选项：

          "opaque":
          这种模式下，alpha 通道会被忽略，所有的颜色都会被认为是完全不透明的。
          适用于不需要透明度的场景，通常可以提高性能。

          "premultiplied":
          这种模式下，颜色值已经预乘了 alpha 值。即颜色的 RGB 分量已经乘以了 alpha 分量。
          适用于已经预乘 alpha 的图像数据。
          
          "unpremultiplied":
          这种模式下，颜色值没有预乘 alpha 值。即颜色的 RGB 分量没有乘以 alpha 分量。
          适用于没有预乘 alpha 的图像数据。
       */
      alphaMode: 'opaque',
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
  public getScale() {
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
