import type {CacheType} from './base'
const generateTextureBindings = (count: number, start) =>
  Array.from(
    {length: count},
    (_, i) => `@group(0) @binding(${i + start}) var imageTexture${i + 1}: texture_2d<f32>;`,
  ).join('\n')

const generateLastBind = cache =>
  cache.lastIndex > cache.startIndex
    ? `@group(0) @binding(${cache.lastIndex}) var<storage, read> imagePos: array<f32>;`
    : ''

const genderateImgPos = (textureCount, cache) =>
  cache.lastIndex > cache.startIndex
    ? /* wgsl */ `
  for (var i: i32 = 0; i < MAX_TEXTURES * PER_SIZE; i += PER_SIZE) {
    let srcIndex = i32(imagePos[i]);
    let x1 = imagePos[i + 1];
    let x2 = imagePos[i + 2];
    let y1 = imagePos[i + 3];
    let y2 = imagePos[i + 4];
    let mx1 = imagePos[i + 5];
    let mx2 = imagePos[i + 6];
    let my1 = imagePos[i + 7];
    let my2 = imagePos[i + 8];

    let isInBounds = srcIndex > 0 &&
    input.v_texcoord.x > x1 && input.v_texcoord.x < x2 &&
    input.v_texcoord.y > y1 && input.v_texcoord.y < y2;
      
      let srcTexcoord = vec2<f32>(
          (input.v_texcoord.x - x1) / (x2 - x1),
          (input.v_texcoord.y - y1) / (y2 - y1)
      );
      let maskTexcoord = vec2<f32>(
          mx1 + srcTexcoord.x * (mx2 - mx1),
          1.0-(my1 + srcTexcoord.y * (my2 - my1)) //Y轴反转
      );

      var srcColor = getSampleFromArray(srcIndex, srcTexcoord);
      let maskColor = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, maskTexcoord);
      srcColor.a = srcColor.a * maskColor.r;

      bgColor = select(
        bgColor,
        vec4<f32>(
            srcColor.rgb * srcColor.a + bgColor.rgb * (1.0 - srcColor.a),
            srcColor.a + bgColor.a * (1.0 - srcColor.a)
        ),
        isInBounds
    );
    }
  `
    : ''
// ========================================================================
export default (cache: CacheType) => {
  const textureCount = cache.lastIndex - cache.startIndex
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
@group(0) @binding(3) var imageSampler: sampler;
${generateTextureBindings(textureCount, cache.startIndex)}
${generateLastBind(cache)}

fn getSampleFromArray(ndx: i32, uv: vec2<f32>) -> vec4<f32> {
  ${Array.from(
    {length: textureCount},
    (_, i) => /* wgsl */ `
  let sample${i + 1} = textureSample(imageTexture${i + 1}, imageSampler, uv);`,
  ).join('\n')}
  
  var result: vec4<f32> = vec4<f32>(0.0);
  ${Array.from(
    {length: textureCount},
    (_, i) => /* wgsl */ `
  result = select(result, sample${i + 1}, ndx == ${i + 1});`,
  ).join('\n')}
  
  return result;
}

const PER_SIZE: i32 = 9;
const MAX_TEXTURES: i32 = ${cache.maxTextures};

@fragment
fn fragMain(input: VertexOutput) -> @location(0) vec4f {
  //
  var v_texcoord = input.v_texcoord;
  v_texcoord.y = 1.0 - v_texcoord.y;
  var v_alpha_texCoord = input.v_alpha_texCoord;
  //
  var bgColor = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, v_texcoord);
  bgColor.a = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, v_alpha_texCoord).r;
  ${genderateImgPos(textureCount, cache)}
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
  // console.log(code)
  return {code}
}
