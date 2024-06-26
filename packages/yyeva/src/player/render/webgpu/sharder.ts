export default (device: GPUDevice, PER_SIZE = 9) => {
  const textureSize = device.limits.maxSampledTexturesPerShaderStage
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

@group(0) @binding(0) var u_image_video: texture_external;
@group(0) @binding(1) var<uniform> u_scale: vec2<f32>;
@group(0) @binding(2) var u_image_video_sampler: sampler;
@group(0) @binding(3) var u_image_sampler: sampler;
//
@group(0) @binding(4) var u_image_1: texture_2d<f32>;
@group(0) @binding(5) var u_image_2: texture_2d<f32>;
@group(0) @binding(6) var u_image_3: texture_2d<f32>;
//
// @group(0) @binding(7) var<uniform> image_pos: array<f32, ${textureSize * PER_SIZE}>;
@group(0) @binding(7) var<uniform> image_pos: array<vec4<f32>, ${textureSize * PER_SIZE}>;

@fragment
fn fragMain(input: VertexOutput) -> @location(0) vec4f {
    let color = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, input.v_texcoord).rgb;
    let alpha = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, input.v_alpha_texCoord).r;
    var bgColor =  vec4<f32>(color,alpha);
    //
    var srcColor: vec4<f32>;
    var maskColor: vec4<f32>;
    var srcTexcoord: vec2<f32>;
    var maskTexcoord: vec2<f32>;
    var srcIndex: i32;
    var x1: f32;
    var x2: f32;
    var y1: f32;
    var y2: f32;
    var mx1: f32;
    var mx2: f32;
    var my1: f32;
    var my2: f32;
    //
    for (var i: i32 = 0; i < ${textureSize * PER_SIZE}; i += ${PER_SIZE}) {
      // let pos = image_pos[0];
      // let x = pos.x;
      // let y = pos.y;
      // let z = pos.z;
      // let w = pos.w;
      // let ix = i32(x);
      // let iy = i32(y);
      // let iz = i32(z);
      // let iw = i32(w);
      //
      // if (i32(image_pos[0]) > 0) {
      //     srcIndex = i32(image_pos[i]);
      //     x1 = image_pos[i + 1];
      //     x2 = image_pos[i + 2];
      //     y1 = image_pos[i + 3];
      //     y2 = image_pos[i + 4];
      //     mx1 = image_pos[i + 5];
      //     mx2 = image_pos[i + 6];
      //     my1 = image_pos[i + 7];
      //     my2 = image_pos[i + 8];
      //     if (v_texcoord.x > x1 && v_texcoord.x < x2 && v_texcoord.y > y1 && v_texcoord.y < y2) {
      //         srcTexcoord = vec2((v_texcoord.x - x1) / (x2 - x1), (v_texcoord.y - y1) / (y2 - y1));
      //         maskTexcoord = vec2(mx1 + srcTexcoord.x * (mx2 - mx1), my1 + srcTexcoord.y * (my2 - my1));
      //         srcColor = getSampleFromArray(srcIndex, srcTexcoord);
      //         maskColor = textureSampleBaseClampToEdge(u_image_video, maskTexcoord);
      //         srcColor.a = srcColor.a * maskColor.r;
      //         bgColor = vec4(srcColor.rgb * srcColor.a, srcColor.a) + (1.0 - srcColor.a) * bgColor;
      //     }
      // }
    }
    //
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
