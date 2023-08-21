import {MixEvideoOptions, VideoAnimateDataItemType} from 'src/type/mix'
import VideoEntity from 'src/player/render/videoEntity'
import WebGL from 'src/player/render/webglEntity'
import RenderCache from './renderCache'
// import MCache from './mCache'
import {logger} from 'src/helper/logger'
export default class WglRender {
  private video: HTMLVideoElement | undefined
  private program: WebGLProgram | undefined
  public isPlay = false
  // private dpr = 1
  private op: MixEvideoOptions
  public videoEntity: VideoEntity
  public webgl: WebGL
  public renderCache: RenderCache
  private textureMap: any = {}
  private imagePos: any
  private currentFrame = -1 //过滤重复帧
  public videoSeekedEvent() {
    return this.renderCache.mCache.videoSeekedEvent()
  }
  constructor(op: MixEvideoOptions) {
    logger.debug('[Render In Webgl]')
    this.op = op
    // this.dpr = self.devicePixelRatio
    this.webgl = new WebGL(op)

    //TODO 观察是否需要添加
    this.webgl.ofs.addEventListener('webglcontextlost', e => {
      logger.debug('[webglcontextlost]', e)
    })
    this.webgl.ofs.addEventListener('webglcontextrestored', () => {
      logger.debug('[webglcontextrestored]')
      this.webgl.initGlContext()
      this.initWebgl()
    })

    this.renderCache = new RenderCache(this.webgl.ofs, this.op)
    this.videoEntity = new VideoEntity(op)
  }
  public async setup(video?: HTMLVideoElement) {
    if (!video) throw new Error('video must support!')
    // MCache.videoDurationTime = video.duration
    await this.renderCache.setup()
    await this.videoEntity.setup()
    this.video = video
    //
    this.resizeCanvasToDisplaySize()
    this.initWebgl()
    // this.video.currentTime 当前播放位置
    // this.video.duration 媒体的持续时间(总长度)，以秒为单位
  }
  private resizeCanvasToDisplaySize() {
    const descript = this.videoEntity.config?.descript
    const ofs = this.webgl.ofs
    if (!descript) {
      if (!this.video) return
      const vw = this.video.videoWidth ? this.video.videoWidth / 2 : 900
      const vh = this.video.videoHeight ? this.video.videoHeight : 1000
      logger.debug('[resizeCanvasToDisplaySize]', vw, vh)
      // 默认左右结构
      ofs.width = vw
      ofs.height = vh
    } else {
      // 实际渲染大小
      const [x, y, w, h] = descript.rgbFrame
      ofs.width = w
      ofs.height = h
    }
    if (this.op.useOfsRender) {
      this.webgl.canvas.width = ofs.width
      this.webgl.canvas.height = ofs.height
    }
  }
  public destroy() {
    this.webgl.destroy()
    this.videoEntity.destroy()
    this.renderCache.destroy()
  }

  // public render(nextFPS: number) {
  public render(frame = 0) {
    // console.log('[render]', frame, this.op.useFrameCache)
    if (!this.isPlay || !this.webgl.gl || !this.video || !this.program || this.currentFrame === frame) return

    this.currentFrame = frame
    const gl = this.webgl.gl
    //
    if (this.op.useFrameCache) {
      const {width, height} = this.webgl.canvas
      const frameItem = this.renderCache.getCache(frame)
      // console.log('[frameItem]', frameItem)
      if (frameItem === 'skip') return
      if (frameItem) {
        // console.log('[in frame cache]', frame, frameItem)
        this.webgl.ctx.clearRect(0, 0, width, height)
        this.webgl.ctx.drawImage(frameItem, 0, 0, width, height, 0, 0, width, height)
        return
      }

      // if (frame > 0) {
      //   //对上一帧，即是渲染已经生效的帧缓存，
      //   //因为对webgl的调用是post类型的操作，即调用不一定马上生效，渲染结果不一定马上呈现，在渲染代码后面缓存有可能是上一帧的结果，导致缓存帧跳动
      //   this.renderCache.setCache(frame - 1)
      // }
    }

    const descript = this.videoEntity.config?.descript
    if (descript) {
      /* const timePoint = info && info.mediaTime && info.mediaTime >= 0 ? info.mediaTime : this.video.currentTime
      const fps = info.fps || this.op.fps || 20
      const frame = Math.round(timePoint * fps) + (this.op.offset || 0) */
      //
      const frameData = this.videoEntity.getFrame(frame)
      const frameItem = frameData ? frameData[this.videoEntity.data] : undefined
      let posArr: any = []
      const {width: vW, height: vH} = descript
      if (frameItem) {
        frameItem.forEach((o: VideoAnimateDataItemType) => {
          posArr[posArr.length] = +this.textureMap[o[this.videoEntity.effectId]]
          // frame坐标是最终展示坐标，这里glsl中计算使用视频坐标
          const [rgbX, rgbY] = descript.rgbFrame
          const [x, y, w, h] = o[this.videoEntity.renderFrame]
          const [mX, mY, mW, mH] = o[this.videoEntity.outputFrame]
          const coord = this.computeCoord(x + rgbX, y + rgbY, w, h, vW, vH)
          const mCoord = this.computeCoord(mX, mY, mW, mH, vW, vH)

          posArr = posArr.concat(coord).concat(mCoord)
        })
      }
      //
      const size = (gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - 1) * this.webgl.PER_SIZE
      posArr = posArr.concat(new Array(size - posArr.length).fill(0))
      this.imagePos = this.imagePos || gl.getUniformLocation(this.program, 'image_pos')
      gl.uniform1fv(this.imagePos, new Float32Array(posArr))
    }
    // 如果意外暂停播放，尝试再次播放。
    // if (this.video.paused) {
    //   this.video.play()
    // }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video) // 指定二维纹理方式
    /**
     * 评估是否需要加入
     */
    // gl.clear(gl.COLOR_BUFFER_BIT)
    //
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    //
    if (this.op.useOfsRender) {
      const {width, height} = this.webgl.canvas
      this.webgl.ctx.clearRect(0, 0, width, height)
      this.webgl.ctx.drawImage(gl.canvas, 0, 0, width, height, 0, 0, width, height)
    }
    if (this.op.useFrameCache) {
      this.renderCache.setCache(frame)
    }
  }
  private getScale() {
    let scaleX = 1
    let scaleY = 1
    if (this.video && this.op.mode) {
      const ofs = this.webgl.canvas ? this.webgl.canvas : (this.webgl.ofs as HTMLCanvasElement)
      const canvasAspect = ofs.clientWidth / ofs.clientHeight
      const videoAspect = ofs.width / ofs.height

      ofs.setAttribute('class', `e-video-${this.op.mode.toLocaleLowerCase()}`)
      switch (this.op.mode) {
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
      // console.log('canvasAspect', canvasAspect)
      // console.log('videoAspect', videoAspect)
      // console.log('scaleX', scaleX, scaleY)
    }
    return [scaleX, scaleY]
  }
  private initWebgl() {
    if (!this.webgl.gl) return
    const gl = this.webgl.gl
    // 设置canvas宽高
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    //=================== 混合功能，将片元颜色和颜色缓冲区的颜色进行混合
    gl.disable(gl.BLEND)
    //=================== 分别设置应用在 RGB 和 Alpha 上的 factor。比如我们不想修改混合颜色之后的 Alpha 值，可以这样做
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    //=================== 对纹理图像进行y轴反转，
    // 因为WebGL纹理坐标系统的t轴（分为t轴和s轴）的方向和图片的坐标系统Y轴方向相反。因此将Y轴进行反转。
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    //=================== 创建着色器程序
    const program = this.createProgram(gl)
    if (!program) return
    this.program = program
    this.initTexture(gl, program)
    this.initVideoTexture(gl, program)
    //
    const scaleLocation = gl.getUniformLocation(program, 'u_scale')
    //
    const scale = this.getScale()
    gl.uniform2fv(scaleLocation, new Float32Array(scale))
    // gl.uniform2fv(scaleLocation, [this.dpr, this.dpr])
    // console.log('this.webgl.gl', this.webgl.gl)
  }
  private initTexture(gl: WebGLRenderingContext, program: WebGLProgram) {
    let i = 1
    const effect = this.videoEntity.config?.effect
    if (effect) {
      for (const k in effect) {
        const r = effect[k]
        // console.log('### effect videoEntity', r)
        r.img && this.createTexture(gl, i, r.img)
        const sampler = gl.getUniformLocation(program, `u_image${i}`)
        gl.uniform1i(sampler, i)
        this.textureMap[r[this.videoEntity.effectId]] = i++
      }
      // dump?
      const dumpTexture = gl.createTexture()
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, dumpTexture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }
    // video
    this.createTexture(gl, i)
    const sampler = gl.getUniformLocation(program, `u_image_video`)
    gl.uniform1i(sampler, i)
  }
  private getRgbaPos() {
    const descript = this.videoEntity.config?.descript
    if (descript) {
      //=================== 创建缓冲区
      const {width: vW, height: vH} = descript
      const [rgbX, rgbY, rgbW, rgbH] = descript.rgbFrame
      const [aX, aY, aW, aH] = descript.alphaFrame
      return {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH}
    } else if (this.video) {
      //默认为左右均分
      const vW = this.video.videoWidth ? this.video.videoWidth : 1800
      const vH = this.video.videoHeight ? this.video.videoHeight : 1000
      const stageW = vW / 2
      const [rgbX, rgbY, rgbW, rgbH] = this.op.alphaDirection === 'right' ? [0, 0, stageW, vH] : [stageW, 0, stageW, vH]
      const [aX, aY, aW, aH] = this.op.alphaDirection === 'right' ? [stageW, 0, stageW, vH] : [0, 0, stageW, vH]
      return {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH}
    }
  }
  private initVideoTexture(gl: WebGLRenderingContext, program: WebGLProgram) {
    const ver = []
    const pos = this.getRgbaPos()
    if (!pos) return
    const {rgbX, rgbY, rgbW, rgbH, vW, vH, aX, aY, aW, aH} = pos
    const rgbCoord = this.computeCoord(rgbX, rgbY, rgbW, rgbH, vW, vH)
    const aCoord = this.computeCoord(aX, aY, aW, aH, vW, vH)
    ver.push(...[-1, 1, rgbCoord[0], rgbCoord[3], aCoord[0], aCoord[3]])
    ver.push(...[1, 1, rgbCoord[1], rgbCoord[3], aCoord[1], aCoord[3]])
    ver.push(...[-1, -1, rgbCoord[0], rgbCoord[2], aCoord[0], aCoord[2]])
    ver.push(...[1, -1, rgbCoord[1], rgbCoord[2], aCoord[1], aCoord[2]])
    const view = new Float32Array(ver)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()) // 创建buffer 把缓冲区对象绑定到目标
    gl.bufferData(gl.ARRAY_BUFFER, view, gl.STATIC_DRAW) // 向缓冲区对象写入刚定义的顶点数据
    //关联 program变量
    const aPosition = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPosition)
    const aTexCoord = gl.getAttribLocation(program, 'a_texCoord')
    gl.enableVertexAttribArray(aTexCoord)
    const aAlphaTexCoord = gl.getAttribLocation(program, 'a_alpha_texCoord')
    gl.enableVertexAttribArray(aAlphaTexCoord)
    // 将缓冲区对象分配给a_position变量、a_texCoord变量
    const size = view.BYTES_PER_ELEMENT

    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, size * 6, 0) // 顶点着色器位置
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, size * 6, size * 2) // rgb像素位置
    gl.vertexAttribPointer(aAlphaTexCoord, 2, gl.FLOAT, false, size * 6, size * 4) // rgb像素位置
  }
  private createProgram(gl: WebGLRenderingContext) {
    // vec4代表4维变量，因为rgba是4个值
    // -0.5代表画布左侧，取值是rgb中的r值
    const vsSource = this.webgl.getVsSource() // 顶点着色器glsl代码
    const fsSource = this.webgl.getFsSource() // 片元着色器 glsl 代码
    const vsShader = this.createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fsShader = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    const program = gl.createProgram()
    if (!program || !vsShader || !fsShader) return
    gl.attachShader(program, vsShader)
    gl.attachShader(program, fsShader)
    gl.linkProgram(program)
    gl.useProgram(program)
    return program
  }
  private createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)
    if (!shader) return
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      logger.error(gl.getShaderInfoLog(shader))
    }
    return shader
  }
  /**
   *
   * @param x 位移转矩阵坐标
   * @param y
   * @param w
   * @param h
   * @param vw
   * @param vh
   * @returns
   */
  private computeCoord(x: number, y: number, w: number, h: number, vw: number, vh: number) {
    // leftX rightX bottomY topY
    return [x / vw, (x + w) / vw, (vh - y - h) / vh, (vh - y) / vh]
  }
  /**
   *
   * @param gl 创建纹理
   * @param index
   * @param imgData
   * @returns
   */
  private createTexture(gl: WebGLRenderingContext, index: number, imgData?: TexImageSource) {
    const texture = gl.createTexture()
    const textrueIndex = gl.TEXTURE0 + index
    logger.debug('[createTexture]', textrueIndex, index, imgData)
    gl.activeTexture(textrueIndex)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    if (imgData) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgData)
    }
    return texture
  }
}
