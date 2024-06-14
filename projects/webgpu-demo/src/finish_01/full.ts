export const code = /* wgsl */ `
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_external;

@fragment
fn fragMain(@location(0) v_texcoord : vec2f,@location(1) v_alpha_texCoord : vec2f) -> @location(0) vec4f {
  let color =  textureSampleBaseClampToEdge(myTexture, mySampler, v_texcoord).rgb;
  let alpha =  textureSampleBaseClampToEdge(myTexture, mySampler, v_alpha_texCoord).r;
  return vec4<f32>(color,alpha);
}

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) v_texcoord : vec2f,
  @location(1) v_alpha_texCoord : vec2f,
}

@vertex
fn vertMain(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  const pos = array(
    vec2( 1.0,  1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0, -1.0),
    
    vec2( 1.0,  1.0),
    vec2(-1.0, -1.0),
    vec2(-1.0,  1.0),
  );

  // color
  const uv = array(
    vec2(0.5, 0.0),
    vec2(0.5, 1.0),
    vec2(0.0, 1.0),

    vec2(0.5, 0.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
  );

  // alpha
  const af = array(
    vec2(1, 0),
    vec2(1, 1.0),
    vec2(0.5, 1.0),

    vec2(1, 0.0),
    vec2(0.5, 1),
    vec2(0.5, 0),
  );

  const u_scale = vec2(1.35,1);

  var output : VertexOutput;
  output.Position = vec4<f32>(pos[VertexIndex] * u_scale, 0.0, 1.0);
  output.v_texcoord = uv[VertexIndex];
  output.v_alpha_texCoord = af[VertexIndex];
  return output;
}
`

export const code1 = /* wgsl */ `
struct Uniforms {
    u_scale: vec2<f32>
};

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

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var u_image_video_sampler: sampler;
@group(0) @binding(2) var u_image_video: texture_external;

@fragment
fn fragMain(input: VertexOutput) -> @location(0) vec4f {
    let color = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, input.v_texcoord).rgb;
    let alpha = textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, input.v_alpha_texCoord).r;
    return vec4<f32>(color,alpha);
}

@vertex
fn vertMain(input: VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.pos = vec4<f32>(uniforms.u_scale * input.a_position, 0.0, 1.0);
  output.v_texcoord = input.a_texCoord;
  output.v_alpha_texCoord = input.a_alpha_texCoord;
  return output;
}
`
