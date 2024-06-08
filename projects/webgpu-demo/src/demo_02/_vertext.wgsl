struct VertexInput {
    [[location(0)]] a_position: vec2<f32>;
    [[location(1)]] a_texCoord: vec2<f32>;
    [[location(2)]] a_alpha_texCoord: vec2<f32>;
};

struct VertexOutput {
    [[builtin(position)]] gl_Position: vec4<f32>;
    [[location(0)]] v_texcoord: vec2<f32>;
    [[location(1)]] v_alpha_texCoord: vec2<f32>;
};

[[stage(vertex)]]
fn main(
    input: VertexInput,
    @builtin(instance_index) instance_index: u32
) -> VertexOutput {
    var output: VertexOutput;
    output.gl_Position = vec4<f32>(u_scale * input.a_position, 0.0, 1.0);
    output.v_texcoord = input.a_texCoord;
    output.v_alpha_texCoord = input.a_alpha_texCoord;
    return output;
}