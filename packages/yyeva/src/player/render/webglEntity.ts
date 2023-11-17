import {logger} from 'src/helper/logger'
import {MixEvideoOptions, ResizeCanvasType, WebglVersion} from 'src/type/mix'
import MCache from './mCache'
import {isOffscreenCanvasSupported} from 'src/helper/utils'
export default class Webgl {
  public PER_SIZE = 9
  public canvas?: HTMLCanvasElement //显示画布
  public ctx?: CanvasRenderingContext2D
  public ofs: HTMLCanvasElement | OffscreenCanvas
  public version: WebglVersion
  public gl: WebGLRenderingContext | null

  private op: MixEvideoOptions
  constructor(op: MixEvideoOptions) {
    if (op.useOfsRender) {
      this.canvas = document.createElement('canvas')
      this.ctx = this.canvas.getContext('2d')
      op.container.appendChild(this.canvas)
      if (op.resizeCanvas) {
        // this.canvas.style.width = '100%'
        // this.canvas.style.height = '100%'
        this.setSizeCanvas(this.canvas, op.resizeCanvas)
      }
      // this.ofs = MCache.getOfs(op)
      this.ofs =
        isOffscreenCanvasSupported() && !!self.createImageBitmap && op.useBitmap
          ? new OffscreenCanvas(300, 300)
          : document.createElement('canvas')
    } else {
      this.ofs = document.createElement('canvas')
      if (op.resizeCanvas) {
        // this.ofs.style.width = '100%'
        // this.ofs.style.height = '100%'
        this.setSizeCanvas(this.ofs, op.resizeCanvas)
      }
      op.container.appendChild(this.ofs)
    }
    this.initGlContext()
    this.op = op
  }
  private setSizeCanvas(canvas: HTMLCanvasElement, resizeCanvas: ResizeCanvasType) {
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
  public initGlContext() {
    const canvas = this.ofs
    const op: WebGLContextAttributes = {
      alpha: true, //指示Canvas是否含有透明通道，若设置为false不透明，如果Canvas下叠加了其他元素时，可以在绘制时提升一些性能
      antialias: false, //绘制时是否开启抗锯齿功能
      depth: true, //是否开启深度缓冲功能
      failIfMajorPerformanceCaveat: false, //性能较低时，将不允许创建context。也就是是getContext()返回null [ios 会因此产生问题]
      premultipliedAlpha: true, //将alpha通道预先乘入rgb通道内，以提高合成性能
      stencil: false, //是否开启模板缓冲功能
      preserveDrawingBuffer: false, //是否保留缓冲区数据，如果你需要读取像素，或者复用绘制到主屏幕上的图像
    }
    this.gl = canvas.getContext('webgl2', op)
    this.version = 2
    if (!this.gl) {
      this.gl = canvas.getContext('webgl', op)
      this.version = 1
      if (!this.gl) {
        this.version = 'canvas2d'
      }
    }
    // gl.enable(this.gl.STENCIL_TEST)
  }
  public destroy() {
    if (this.gl) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT)
      this.gl = null
    }
    if (this.canvas) this.canvas.remove()
    if (this.ofs instanceof HTMLCanvasElement) {
      this.ofs.remove()
      this.gl = null
      logger.debug('[destroy remove canvas]')
    } else this.ofs = undefined
  }
  getVsSource(): string {
    const cb = this.version === 2 ? this.getVs2() : this.getVs1()
    // console.log('vs', cb)
    return cb
  }
  getFsSource(): string {
    const cb = this.version === 2 ? this.getFs2() : this.getFs1()
    // console.log('fs', cb)
    return cb
  }
  getVs2() {
    return `#version 300 es
    in vec2 a_position; // 接受顶点坐标
    in vec2 a_texCoord; // 接受纹理坐标
    in vec2 a_alpha_texCoord; // 接受纹理坐标
    out vec2 v_alpha_texCoord; // 接受纹理坐标
    out vec2 v_texcoord; // 传递纹理坐标给片元着色器
    uniform vec2 u_scale;
    void main(void) {
      gl_Position = vec4(u_scale * a_position, 0.0, 1.0); // 设置坐标
      v_texcoord = a_texCoord; // 设置纹理坐标
      v_alpha_texCoord = a_alpha_texCoord; // 设置纹理坐标
    }
    `
  }
  getVs1() {
    return `attribute vec2 a_position; // 接受顶点坐标
    attribute vec2 a_texCoord; // 接受纹理坐标
    attribute vec2 a_alpha_texCoord; // 接受纹理坐标
    varying vec2 v_alpha_texCoord; // 接受纹理坐标
    varying vec2 v_texcoord; // 传递纹理坐标给片元着色器
    uniform vec2 u_scale;
    void main(void){
       gl_Position = vec4(u_scale * a_position, 0.0, 1.0); // 设置坐标
       v_texcoord = a_texCoord; // 设置纹理坐标
       v_alpha_texCoord = a_alpha_texCoord; // 设置纹理坐标
    }`
  }
  getFs2() {
    if (!this.gl) return ''
    const gl = this.gl
    /*     const bgColor =
      this.op.alphaDirection === 'right'
        ? `vec4(texture(u_image_video, v_texcoord).rgb, texture(u_image_video,v_alpha_texCoord).r);`
        : `vec4(texture(u_image_video,v_alpha_texCoord).rgb,texture(u_image_video, v_texcoord).r);` */
    const bgColor = `vec4(texture(u_image_video, v_texcoord).rgb, texture(u_image_video,v_alpha_texCoord).r);`
    //片断着色器没有默认精度，所以我们需要设置一个精度
    const textureSize = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - 1
    // const textureSize =0
    let sourceTexure = ''
    let sourceUniform = ''
    if (textureSize > 0 && (this.op.dataUrl || this.op.useMetaData)) {
      const imgColor = []
      const samplers = []
      for (let i = 0; i < textureSize; i++) {
        imgColor.push(
          `if(ndx == ${i + 1}){
                          color = texture(u_image${i + 1},uv);
                      }`,
        )
        samplers.push(`uniform sampler2D u_image${i + 1};`)
      }

      sourceUniform = `
              ${samplers.join('\n')}
              uniform float image_pos[${textureSize * this.PER_SIZE}];
              vec4 getSampleFromArray(int ndx, vec2 uv) {
                  vec4 color;
                  ${imgColor.join(' else ')}
                  return color;
              }
              `
      sourceTexure = `
              vec4 srcColor,maskColor;
              vec2 srcTexcoord,maskTexcoord;
              int srcIndex;
              float x1,x2,y1,y2,mx1,mx2,my1,my2; //显示的区域

              for(int i=0;i<${textureSize * this.PER_SIZE};i+= ${this.PER_SIZE}){
                  if ((int(image_pos[i]) > 0)) {
                    srcIndex = int(image_pos[i]);

                      x1 = image_pos[i+1];
                      x2 = image_pos[i+2];
                      y1 = image_pos[i+3];
                      y2 = image_pos[i+4];

                      mx1 = image_pos[i+5];
                      mx2 = image_pos[i+6];
                      my1 = image_pos[i+7];
                      my2 = image_pos[i+8];


                      if (v_texcoord.s>x1 && v_texcoord.s<x2 && v_texcoord.t>y1 && v_texcoord.t<y2) {
                          srcTexcoord = vec2((v_texcoord.s-x1)/(x2-x1),(v_texcoord.t-y1)/(y2-y1));
                           maskTexcoord = vec2(mx1+srcTexcoord.s*(mx2-mx1),my1+srcTexcoord.t*(my2-my1));
                           srcColor = getSampleFromArray(srcIndex,srcTexcoord);
                           maskColor = texture(u_image_video, maskTexcoord);
                           srcColor.a = srcColor.a*(maskColor.r);

                           bgColor = vec4(srcColor.rgb*srcColor.a,srcColor.a) + (1.0-srcColor.a)*bgColor;

                      }
                  }
              }
              `
    }
    return `#version 300 es
      precision lowp float;
      in vec2 v_texcoord;
      in vec2 v_alpha_texCoord;
      out vec4 fragColor;
      uniform sampler2D u_image_video;
      ${sourceUniform}

      void main(void) {
          vec4 bgColor = ${bgColor}
          ${sourceTexure}
          fragColor = bgColor;
      }
      `
  }
  getFs1() {
    if (!this.gl) return ''
    const gl = this.gl
    const bgColor = `vec4(texture2D(u_image_video, v_texcoord).rgb, texture2D(u_image_video,v_alpha_texCoord).r);`
    //片断着色器没有默认精度，所以我们需要设置一个精度
    const textureSize = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - 1
    // const textureSize =0
    let sourceTexure = ''
    let sourceUniform = ''
    if (textureSize > 0) {
      const imgColor = []
      const samplers = []
      for (let i = 0; i < textureSize; i++) {
        imgColor.push(
          `if(ndx == ${i + 1}){
                          color = texture2D(u_image${i + 1},uv);
                      }`,
        )
        samplers.push(`uniform sampler2D u_image${i + 1};`)
      }

      sourceUniform = `
              ${samplers.join('\n')}
              uniform float image_pos[${textureSize * this.PER_SIZE}];
              vec4 getSampleFromArray(int ndx, vec2 uv) {
                  vec4 color;
                  ${imgColor.join(' else ')}
                  return color;
              }
              `
      sourceTexure = `
              vec4 srcColor,maskColor;
              vec2 srcTexcoord,maskTexcoord;
              int srcIndex;
              float x1,x2,y1,y2,mx1,mx2,my1,my2; //显示的区域

              for(int i=0;i<${textureSize * this.PER_SIZE};i+= ${this.PER_SIZE}){
                  if ((int(image_pos[i]) > 0)) {
                    srcIndex = int(image_pos[i]);

                      x1 = image_pos[i+1];
                      x2 = image_pos[i+2];
                      y1 = image_pos[i+3];
                      y2 = image_pos[i+4];

                      mx1 = image_pos[i+5];
                      mx2 = image_pos[i+6];
                      my1 = image_pos[i+7];
                      my2 = image_pos[i+8];


                      if (v_texcoord.s>x1 && v_texcoord.s<x2 && v_texcoord.t>y1 && v_texcoord.t<y2) {
                          srcTexcoord = vec2((v_texcoord.s-x1)/(x2-x1),(v_texcoord.t-y1)/(y2-y1));
                           maskTexcoord = vec2(mx1+srcTexcoord.s*(mx2-mx1),my1+srcTexcoord.t*(my2-my1));
                           srcColor = getSampleFromArray(srcIndex,srcTexcoord);
                           maskColor = texture2D(u_image_video, maskTexcoord);
                           srcColor.a = srcColor.a*(maskColor.r);

                           bgColor = vec4(srcColor.rgb*srcColor.a,srcColor.a) + (1.0-srcColor.a)*bgColor;

                      }
                  }
              }
              `
    }
    return `
      precision lowp float;
      varying vec2 v_texcoord;
      varying vec2 v_alpha_texCoord;
      uniform sampler2D u_image_video;
      ${sourceUniform}

      void main(void) {
          vec4 bgColor = ${bgColor}
          ${sourceTexure}
          // bgColor = texture2D(u_image[0], v_texcoord);
          gl_FragColor = bgColor;
      }
      `
  }
}
