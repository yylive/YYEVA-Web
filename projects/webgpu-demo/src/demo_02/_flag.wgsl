@group(0) @binding(0) var u_image_video_sampler: sampler;
@group(0) @binding(1) var u_image_video: texture_2d<f32>;

struct FragmentInput {
    @location(0) v_texcoord: vec2<f32>,
    @location(1) v_alpha_texCoord: vec2<f32>
};

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    let color = textureSample(u_image_video, u_image_video_sampler, input.v_texcoord);
    let alpha = textureSample(u_image_video, u_image_video_sampler, input.v_alpha_texCoord).r;
    return vec4<f32>(color.rgb, alpha);
}