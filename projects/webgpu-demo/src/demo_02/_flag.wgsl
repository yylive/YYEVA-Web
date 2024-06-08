struct FragmentInput {
    [[location(0)]] v_texcoord: vec2<f32>;
    [[location(1)]] v_alpha_texCoord: vec2<f32>;
};

struct FragmentOutput {
    [[location(0)]] output_color: vec4<f32>;
};

[[group(0), binding(0)]]
var u_image_video: texture_2d<f32>;

[[stage(fragment)]]
fn main(input: FragmentInput) -> FragmentOutput {
    let bgColor = vec4<f32>(
        textureSample(u_image_video, input.v_texcoord).rgb,
        textureSample(u_image_video, input.v_alpha_texCoord).r
    );

    var output: FragmentOutput;
    output.output_color = bgColor;
    return output;
}