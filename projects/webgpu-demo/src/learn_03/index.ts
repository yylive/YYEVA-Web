import fullCode from './full.wgsl'
async function initWebGPU(): Promise<any> {
  if (!navigator.gpu) {
    console.error('WebGPU is not supported on this browser.')
    return
  }

  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    console.error('Failed to get GPU adapter.')
    return
  }

  const device = await adapter.requestDevice()
  const canvas = document.createElement('canvas') as HTMLCanvasElement
  const context = canvas.getContext('webgpu') as GPUCanvasContext
  document.body.appendChild(canvas)
  const format = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device: device,
    format: format,
    alphaMode: 'opaque',
  })

  return {device, context, format}
}

async function createTextureAndSampler(device: GPUDevice, video: HTMLVideoElement) {
  const texture = device.createTexture({
    size: [video.videoWidth, video.videoHeight, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  })

  const sampler = device.createSampler({
    minFilter: 'linear',
    magFilter: 'linear',
    mipmapFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
    addressModeW: 'clamp-to-edge',
  })

  // Update texture with video frame data
  // This part might involve copying video frame data to the GPU texture
  // using GPU queue copy operations or other methods.

  return {texture, sampler}
}

function updateTexture(device: GPUDevice, texture: GPUTexture, video: HTMLVideoElement) {
  //   const videoFrame = video as unknown as HTMLVideoElement & {currentFrame: ImageBitmap}
  device.queue.copyExternalImageToTexture({source: video}, {texture: texture}, [video.videoWidth, video.videoHeight])
}

async function createBindGroup(device: GPUDevice, texture: GPUTexture, sampler: GPUSampler, scale: Float32Array) {
  const uniformBuffer = device.createBuffer({
    size: 2 * 4, // vec2<f32> has 2 floats, each float is 4 bytes
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })

  device.queue.writeBuffer(uniformBuffer, 0, scale)

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {type: 'uniform'},
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {type: 'filtering'},
      },
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {sampleType: 'float'},
      },
    ],
  })

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: texture.createView(),
      },
    ],
  })

  return {bindGroup, bindGroupLayout, uniformBuffer}
}

async function createPipeline(device: GPUDevice, format: GPUTextureFormat, bindGroupLayout: GPUBindGroupLayout) {
  const cellShaderModule = device.createShaderModule(fullCode)
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: cellShaderModule,
      entryPoint: 'vertexMain',
    },
    fragment: {
      module: cellShaderModule,
      entryPoint: 'fragmentMain',
      targets: [{format: format}],
    },
    primitive: {
      topology: 'triangle-strip',
      stripIndexFormat: 'uint32',
    },
  })
  return pipeline
}

async function render(
  device: GPUDevice,
  context: GPUCanvasContext,
  pipeline: GPURenderPipeline,
  bindGroup: GPUBindGroup,
) {
  const commandEncoder = device.createCommandEncoder()
  const textureView = context.getCurrentTexture().createView()

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: textureView,
        clearValue: [0.0, 0.0, 0.0, 1.0],
        storeOp: 'store',
        loadOp: 'clear',
      },
    ],
  }
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
  passEncoder.setPipeline(pipeline)
  passEncoder.setBindGroup(0, bindGroup)
  passEncoder.draw(4, 1, 0, 0) // Draw a single quad
  passEncoder.end()

  device.queue.submit([commandEncoder.finish()])
}

async function main() {
  //   console.log('render')
  const video = document.createElement('video')
  video.muted = true
  video.loop = true
  video.preload = 'auto'
  video.src = '/af.mp4'
  await video.play()
  // Ensure video is loaded
  //   await new Promise(resolve => {
  //     video.onloadeddata = () => resolve(null)
  //   })

  const {device, context, format} = await initWebGPU()
  const {texture, sampler} = await createTextureAndSampler(device, video)

  // Example scale factor for the uniforms
  const scale = new Float32Array([1.0, 1.0])
  const {bindGroup, bindGroupLayout, uniformBuffer} = await createBindGroup(device, texture, sampler, scale)

  const pipeline = await createPipeline(device, format, bindGroupLayout)

  function frame() {
    // console.log('render')
    updateTexture(device, texture, video)
    render(device, context, pipeline, bindGroup)
    video.requestVideoFrameCallback(frame)
  }

  video.requestVideoFrameCallback(frame)
}

main().catch(console.error)
