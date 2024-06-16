export default (device: GPUDevice, PER_SIZE = 9) => {
  const textureSize = device.limits.maxSampledTexturesPerShaderStage
  //
  const code = /* wgsl */ `
    struct VertexInput {
        @location(0) a_position: vec2<f32>,
        @location(1) a_texCoord: vec2<f32>,
        @location(2) a_alpha_texCoord: vec2<f32>,
    };
    
    struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) v_texcoord: vec2<f32>,
        @location(1) v_alpha_texCoord: vec2<f32>,
    };
    
    @group(0) @binding(0) var<uniform> u_scale: vec2<f32>;
    
    @vertex
    fn vertMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.position = vec4(input.a_position * u_scale, 0.0, 1.0);
        output.v_texcoord = input.a_texCoord;
        output.v_alpha_texCoord = input.a_alpha_texCoord;
        return output;
    }
    @group(0) @binding(1) var u_image_video: texture_external;
    @group(0) @binding(2) var<uniform> image_pos: array<f32, ${textureSize * PER_SIZE}>;
    
    fn getSampleFromArray(ndx: i32, uv: vec2<f32>) -> vec4<f32> {
        var color: vec4<f32>;
    
        ${[...Array(textureSize).keys()]
          .map(
            i => `
        if (ndx == ${i + 1}) {
            color = textureSample(u_image${i + 1}, uv);
        }`,
          )
          .join(' else ')}
    
        return color;
    }
    
    @fragment
    fn fragMain(@location(0) v_texcoord: vec2<f32>,
            @location(1) v_alpha_texCoord: vec2<f32>) -> @location(0) vec4<f32> {
        var bgColor = vec4(textureSampleBaseClampToEdge(u_image_video, v_texcoord).rgb, textureSampleBaseClampToEdge(u_image_video, v_alpha_texCoord).r);
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
    
        for (var i: i32 = 0; i < ${textureSize * PER_SIZE}; i += ${PER_SIZE}) {
            if (i32(image_pos[i]) > 0) {
                srcIndex = i32(image_pos[i]);
                x1 = image_pos[i + 1];
                x2 = image_pos[i + 2];
                y1 = image_pos[i + 3];
                y2 = image_pos[i + 4];
                mx1 = image_pos[i + 5];
                mx2 = image_pos[i + 6];
                my1 = image_pos[i + 7];
                my2 = image_pos[i + 8];
                if (v_texcoord.x > x1 && v_texcoord.x < x2 && v_texcoord.y > y1 && v_texcoord.y < y2) {
                    srcTexcoord = vec2((v_texcoord.x - x1) / (x2 - x1), (v_texcoord.y - y1) / (y2 - y1));
                    maskTexcoord = vec2(mx1 + srcTexcoord.x * (mx2 - mx1), my1 + srcTexcoord.y * (my2 - my1));
                    srcColor = getSampleFromArray(srcIndex, srcTexcoord);
                    maskColor = textureSampleBaseClampToEdge(u_image_video, maskTexcoord);
                    srcColor.a = srcColor.a * maskColor.r;
                    bgColor = vec4(srcColor.rgb * srcColor.a, srcColor.a) + (1.0 - srcColor.a) * bgColor;
                }
            }
        }
        return bgColor;
    }
  `
  return {code}
}
