export const VERTEX_SHADER = () => `
  struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) texCoord: vec2<f32>,
    @location(2) alphaTex: vec2<f32>,
  };

  struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
    @location(1) alphaTex: vec2<f32>,
  };

  @group(0) @binding(0)
  uniform Uniforms {
    scale: vec2<f32>,
  };

  @vertex
  fn main(
    input: VertexInput,
  ) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(Uniforms.scale * input.position, 0.0, 1.0);
    output.texCoord = input.texCoord;
    output.alphaTex = input.alphaTex;
    return output;
  }
`

export const FRAGMENT_SHADER = (device: GPUDevice, PER_SIZE = 9) => {
  const maxTextureUnits = device.limits.maxSampledTexturesPerShaderStage
  let sourceUniform = ''
  let sourceTexture = ''

  if (maxTextureUnits > 0) {
    const imageSamplers = []
    const imageColorSampling = []

    for (let i = 0; i < maxTextureUnits; i++) {
      imageSamplers.push(`@group(0) @binding(${i + 1}) var u_image${i + 1} : texture_2d<f32>;`)
      imageColorSampling.push(`
        if (ndx == ${i + 1}) {
          color = textureSample(u_image${i + 1}, sampler, uv);
        }
      `)
    }

    sourceUniform = `
      struct ImageInfo {
        position: vec4<f32>,
        maskPosition: vec4<f32>,
      };

      @group(0) @binding(${maxTextureUnits + 1})
      var<storage, read> image_pos: array<ImageInfo, ${maxTextureUnits * PER_SIZE}>;

      fn getSampleFromArray(ndx: i32, uv: vec2<f32>) -> vec4<f32> {
        var color: vec4<f32>;
        ${imageColorSampling.join(' else ')}
        return color;
      }
    `

    sourceTexture = `
      var srcColor: vec4<f32>;
      var maskColor: vec4<f32>;
      var srcTexCoord: vec2<f32>;
      var maskTexCoord: vec2<f32>;
      var srcIndex: i32;
      var x1: f32, x2: f32, y1: f32, y2: f32;
      var mx1: f32, mx2: f32, my1: f32, my2: f32;

      for (var i: i32 = 0; i < ${maxTextureUnits * PER_SIZE}; i += ${PER_SIZE}) {
        if (image_pos[i].position.x > 0.0) {
          srcIndex = i32(image_pos[i].position.x);
          x1 = image_pos[i].position.x;
          x2 = image_pos[i].position.y;
          y1 = image_pos[i].position.z;
          y2 = image_pos[i].position.w;
          mx1 = image_pos[i].maskPosition.x;
          mx2 = image_pos[i].maskPosition.y;
          my1 = image_pos[i].maskPosition.z;
          my2 = image_pos[i].maskPosition.w;

          if (v_texCoord.x > x1 && v_texCoord.x < x2 && v_texCoord.y > y1 && v_texCoord.y < y2) {
            srcTexCoord = vec2<f32>((v_texCoord.x - x1) / (x2 - x1), (v_texCoord.y - y1) / (y2 - y1));
            maskTexCoord = vec2<f32>(mx1 + srcTexCoord.x * (mx2 - mx1), my1 + srcTexCoord.y * (my2 - my1));
            srcColor = getSampleFromArray(srcIndex, srcTexCoord);
            maskColor = textureSample(u_image_video, sampler, maskTexCoord);
            srcColor.a = srcColor.a * (maskColor.r);
            bgColor = vec4<f32>(srcColor.rgb * srcColor.a, srcColor.a) + (vec4<f32>(1.0) - srcColor.a) * bgColor;
          }
        }
      }
    `
  }

  return `
    @group(0) @binding(${maxTextureUnits + 2})
    var u_image_video: texture_2d<f32>;
    @group(0) @binding(${maxTextureUnits + 3})
    var sampler: sampler;

    ${sourceUniform}

    @fragment
    fn main(
      @builtin(position) position: vec4<f32>,
      @location(0) v_texCoord: vec2<f32>,
      @location(1) v_alphaTex: vec2<f32>
    ) -> @location(0) vec4<f32> {
      var bgColor: vec4<f32> = vec4<f32>(textureSample(u_image_video, sampler, v_texCoord).rgb, textureSample(u_image_video, sampler, v_alphaTex).r);
      ${sourceTexture}
      return bgColor;
    }
  `
}
