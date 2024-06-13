@group(0) @binding(1) var u_image_video_sampler: sampler;
@group(0) @binding(2) var u_image_video: texture_external;

@fragment
fn fragMain(@location(0) fragUV : vec2f) -> @location(0) vec4f {
  return textureSampleBaseClampToEdge(u_image_video, u_image_video_sampler, fragUV);
}

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) fragUV : vec2f,
}

@vertex
fn vertMain(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
  const pos = array(
    vec2(1.0,  1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0, -1.0),
    vec2( 1.0,  1.0),
    vec2(-1.0, -1.0),
    vec2(-1.0,  1.0),
  );

  const uv = array(
    vec2(1.0, 0.0),
    vec2(1.0, 1.0),
    vec2(0.0, 1.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(0.0, 0.0),
  );
    // let pos = array(
 
    // vec2f(0.0, 0.0),  // center
    // vec2f(1.0, 0.0),  // right, center
    // vec2f(0.0, 1.0),  // center, top
 
    // // 2st triangle
    // vec2f(0.0, 1.0),  // center, top
    // vec2f(1.0, 0.0),  // right, center
    // vec2f(1.0, 1.0),  // right, top
  // );

  var output : VertexOutput;
  output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
  output.fragUV = uv[VertexIndex];
  // let xy = pos[VertexIndex];
  // output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
  // output.fragUV = xy;
  return output;
}