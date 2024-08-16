export const VERTEX_SHADER = () => {
  /**
   * 声明 WEBGL
   * 接受顶点坐标
   * 接受纹理坐标
   * 接受纹理坐标
   * 接受纹理坐标
   * 传递纹理坐标给片元着色器
   * 设置坐标
   * 设置纹理坐标
   * 设置纹理坐标
   */
  return `#version 300 es
    in vec2 a_position;
    in vec2 a_texCoord;
    in vec2 a_alpha_texCoord;
    out vec2 v_alpha_texCoord;
    out vec2 v_texcoord;
    uniform vec2 u_scale;
    void main(void) {
      gl_Position = vec4(u_scale * a_position, 0.0, 1.0);
      v_texcoord = a_texCoord;
      v_alpha_texCoord = a_alpha_texCoord;
    }
    `
}

export const FRAGMENT_SHADER = (gl: WebGLRenderingContext | WebGL2RenderingContext, PER_SIZE = 9) => {
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
                          color = texture(u_image${i + 1},uv);
                      }`,
      )
      samplers.push(`uniform sampler2D u_image${i + 1};`)
    }

    sourceUniform = `
              ${samplers.join('\n')}
              uniform float image_pos[${textureSize * PER_SIZE}];
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
              for(int i=0;i<${textureSize * PER_SIZE};i+= ${PER_SIZE}){
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
          vec4 bgColor = vec4(texture(u_image_video, v_texcoord).rgb, texture(u_image_video,v_alpha_texCoord).r);
          ${sourceTexure}
          fragColor = bgColor;
      }
      `
}
