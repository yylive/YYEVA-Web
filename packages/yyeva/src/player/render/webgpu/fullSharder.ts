const generateTextureBindings = (count: number) =>
  Array.from({length: count}, (_, i) => `@group(0) @binding(${i + 1}) var imageTexture${i + 1}: texture_2d<f32>;`).join(
    '\n',
  )

const generateSampleCases = (count: number) =>
  Array.from(
    {length: count},
    (_, i) =>
      `case ${i + 1}: {
          return textureSample(imageTexture${i + 1}, imageSampler, uv);
        }`,
  ).join('\n')

export default (textureCount = 8, PER_SIZE = 9) => {
  //
  const code = /* wgsl */ `
  struct VertexOutput {
      @builtin(position) pos: vec4<f32>,
      @location(0) v_texcoord: vec2<f32>,
      @location(1) v_alpha_texCoord: vec2<f32>
  }
  
  struct VertexInput {
      @location(0) a_position: vec2<f32>,
      @location(1) a_texCoord: vec2<f32>,
      @location(2) a_alpha_texCoord: vec2<f32>
  };
  
  struct ImagePos {
    index: i32,
    x1: f32, x2: f32, y1: f32, y2: f32,
    mx1: f32, mx2: f32, my1: f32, my2: f32,
  };
  
  @group(0) @binding(0) var u_image_video: texture_external;
  @group(0) @binding(1) var<uniform> u_scale: vec2<f32>;
  @group(0) @binding(2) var u_image_video_sampler: sampler;
  @group(0) @binding(3) var<storage, read> imagePos: array<ImagePos>;
  @group(0) @binding(4) var imageSampler: sampler;
  ${generateTextureBindings(textureCount)}
  
  fn getSampleFromArray(index: i32, uv: vec2<f32>) -> vec4<f32> {
    switch index {
        ${generateSampleCases(textureCount)}
        default: {
            return vec4<f32>(0.0);
        }
    }
  }
  
  @fragment
  fn fragMain(input: VertexOutput) -> @location(0) vec4f {
      var bgColor = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, input.v_texcoord);
      bgColor.a = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, input.v_alpha_texCoord).r;
  
      // for (var i: u32 = 0u; i < 1u; i = i + 1u) {
      //   let pos = imagePos[i];
      //   if (pos.index > 0 &&
      //       input.v_texcoord.x > pos.x1 && input.v_texcoord.x < pos.x2 &&
      //       input.v_texcoord.y > pos.y1 && input.v_texcoord.y < pos.y2) {
            
      //       let srcTexcoord = vec2<f32>(
      //           (input.v_texcoord.x - pos.x1) / (pos.x2 - pos.x1),
      //           (input.v_texcoord.y - pos.y1) / (pos.y2 - pos.y1)
      //       );
      //       let maskTexcoord = vec2<f32>(
      //           pos.mx1 + srcTexcoord.x * (pos.mx2 - pos.mx1),
      //           pos.my1 + srcTexcoord.y * (pos.my2 - pos.my1)
      //       );
  
      //       var srcColor = getSampleFromArray(pos.index, srcTexcoord);
      //       let maskColor = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, maskTexcoord);
      //       srcColor.a = srcColor.a * maskColor.r;
  
      //       bgColor = vec4<f32>(
      //           srcColor.rgb * srcColor.a + bgColor.rgb * (1.0 - srcColor.a),
      //           srcColor.a + bgColor.a * (1.0 - srcColor.a)
      //       );
      //   }
      // }
  
      return bgColor;
  }
  
  @vertex
  fn vertMain(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.pos = vec4<f32>(u_scale * input.a_position, 0.0, 1.0);
    output.v_texcoord = input.a_texCoord;
    output.v_alpha_texCoord = input.a_alpha_texCoord;
    return output;
  }
  `
  return {code}
}
