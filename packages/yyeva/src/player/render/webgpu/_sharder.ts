function generateWGSL(textureCount = 8): string {
  const generateTextureBindings = (count: number) =>
    Array.from(
      {length: count},
      (_, i) => `@group(1) @binding(${i + 1}) var imageTexture${i + 1}: texture_2d<f32>;`,
    ).join('\n')

  const generateSampleCases = (count: number) =>
    Array.from(
      {length: count},
      (_, i) =>
        `case ${i + 1}: {
        return textureSample(imageTexture${i + 1}, imageSampler, uv);
      }`,
    ).join('\n')

  return /*wgsl */ `
struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) texCoord: vec2<f32>,
    @location(2) alphaTexCoord: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
    @location(1) alphaTexCoord: vec2<f32>,
};

struct Uniforms {
    scale: vec2<f32>,
    imagePosCount: u32,
};

struct ImagePos {
    index: i32,
    x1: f32, x2: f32, y1: f32, y2: f32,
    mx1: f32, mx2: f32, my1: f32, my2: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var videoSampler: sampler;
@group(0) @binding(2) var videoTexture: texture_2d<f32>;

@group(1) @binding(0) var imageSampler: sampler;
${generateTextureBindings(textureCount)}

@group(2) @binding(0) var<storage, read> imagePos: array<ImagePos>;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(uniforms.scale * input.position, 0.0, 1.0);
    output.texCoord = input.texCoord;
    output.alphaTexCoord = input.alphaTexCoord;
    return output;
}

fn getSampleFromArray(index: i32, uv: vec2<f32>) -> vec4<f32> {
    switch index {
        ${generateSampleCases(textureCount)}
        default: {
            return vec4<f32>(0.0);
        }
    }
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    var bgColor = textureSample(videoTexture, videoSampler, input.texCoord);
    bgColor.a = textureSample(videoTexture, videoSampler, input.alphaTexCoord).r;

    for (var i: u32 = 0u; i < uniforms.imagePosCount; i = i + 1u) {
        let pos = imagePos[i];
        if (pos.index > 0 &&
            input.texCoord.x > pos.x1 && input.texCoord.x < pos.x2 &&
            input.texCoord.y > pos.y1 && input.texCoord.y < pos.y2) {
            
            let srcTexcoord = vec2<f32>(
                (input.texCoord.x - pos.x1) / (pos.x2 - pos.x1),
                (input.texCoord.y - pos.y1) / (pos.y2 - pos.y1)
            );
            let maskTexcoord = vec2<f32>(
                pos.mx1 + srcTexcoord.x * (pos.mx2 - pos.mx1),
                pos.my1 + srcTexcoord.y * (pos.my2 - my1)
            );

            var srcColor = getSampleFromArray(pos.index, srcTexcoord);
            let maskColor = textureSample(videoTexture, videoSampler, maskTexcoord);
            srcColor.a = srcColor.a * maskColor.r;

            bgColor = vec4<f32>(
                srcColor.rgb * srcColor.a + bgColor.rgb * (1.0 - srcColor.a),
                srcColor.a + bgColor.a * (1.0 - srcColor.a)
            );
        }
    }

    return bgColor;
}
`
}

// 使用示例
const wgslCode = generateWGSL()
console.log(wgslCode)
