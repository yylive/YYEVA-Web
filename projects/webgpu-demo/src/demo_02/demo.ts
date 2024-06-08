const pipeline = device.createRenderPipeline({
  // 其他管线配置...
  vertex: {
    module: shaderModule,
    entryPoint: 'main',
    buffers: [
      {
        // 假设所有顶点属性都存储在同一个顶点缓冲区中
        arrayStride: 24, // 每个顶点的总字节大小（例如，每个属性是vec2<f32>，即2*4字节，共3个属性，所以是24字节）
        attributes: [
          {
            // a_position
            shaderLocation: 0, // 对应[[location(0)]]
            offset: 0,
            format: 'float32x2',
          },
          {
            // a_texCoord
            shaderLocation: 1, // 对应[[location(1)]]
            offset: 8, // 偏移量，因为a_position占用前8字节
            format: 'float32x2',
          },
          {
            // a_alpha_texCoord
            shaderLocation: 2, // 对应[[location(2)]]
            offset: 16, // 偏移量，因为a_position和a_texCoord共占用前16字节
            format: 'float32x2',
          },
        ],
      },
      // 如果有更多的顶点缓冲区，可以继续在这里添加
    ],
  },
  // 其他管线配置...
})
