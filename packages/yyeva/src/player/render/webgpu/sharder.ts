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

@group(0) @binding(0) var<uniform> u_scale: vec2<f32>;
@group(0) @binding(1) var u_image_video_sampler: sampler;
@group(0) @binding(2) var u_image_video: texture_external;

@fragment
fn fragMain(input: VertexOutput) -> @location(0) vec4f {
    let color = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, input.v_texcoord).rgb;
    let alpha = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, input.v_alpha_texCoord).r;
    let bgColor =  vec4<f32>(color,alpha);
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
