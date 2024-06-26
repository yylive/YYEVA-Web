import {mat4} from '../webgpu-matrix'
;
import frag from './frag.wgsl'(async () => {
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) return
  const device = await adapter.requestDevice()
  if (!device) {
    console.error('need a browser that supports WebGPU')
    return
  }
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('webgpu') as GPUCanvasContext
  const root = document.getElementById('emp-root')
  root?.appendChild(canvas)
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
  context.configure({
    device,
    format: presentationFormat,
  })

  const module = device.createShaderModule({
    label: 'our hardcoded textured quad shaders',
    ...frag,
  })

  const pipeline = device.createRenderPipeline({
    label: 'hardcoded textured quad pipeline',
    layout: 'auto',
    vertex: {
      module,
    },
    fragment: {
      module,
      targets: [{format: presentationFormat}],
    },
  })

  function startPlayingAndWaitForVideo(video) {
    return new Promise((resolve, reject) => {
      video.addEventListener('error', reject)
      if ('requestVideoFrameCallback' in video) {
        video.requestVideoFrameCallback(resolve)
      } else {
        const timeWatcher = () => {
          if (video.currentTime > 0) {
            resolve()
          } else {
            requestAnimationFrame(timeWatcher)
          }
        }
        timeWatcher()
      }
      video.play().catch(reject)
    })
  }

  const video = document.createElement('video')
  video.muted = true
  video.loop = true
  video.preload = 'auto'
  video.src = '/af.mp4'
  await startPlayingAndWaitForVideo(video)

  canvas.addEventListener('click', () => {
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  })

  // offsets to the various uniform values in float32 indices
  const kMatrixOffset = 0

  const objectInfos: any = []
  for (let i = 0; i < 4; ++i) {
    const sampler = device.createSampler({
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      magFilter: i & 1 ? 'linear' : 'nearest',
      minFilter: i & 2 ? 'linear' : 'nearest',
    })

    // create a buffer for the uniform values
    const uniformBufferSize = 16 * 4 // matrix is 16 32bit floats (4bytes each)
    const uniformBuffer = device.createBuffer({
      label: 'uniforms for quad',
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    // create a typedarray to hold the values for the uniforms in JavaScript
    const uniformValues = new Float32Array(uniformBufferSize / 4)
    const matrix = uniformValues.subarray(kMatrixOffset, 16)

    // Save the data we need to render this object.
    objectInfos.push({
      sampler,
      matrix,
      uniformValues,
      uniformBuffer,
    })
  }

  const renderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [
      {
        // view: <- to be filled out when we render
        clearValue: [0.3, 0.3, 0.3, 1],
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  }

  function render() {
    const fov = (60 * Math.PI) / 180 // 60 degrees in radians
    const aspect = canvas.clientWidth / canvas.clientHeight
    const zNear = 1
    const zFar = 2000
    const projectionMatrix = mat4.perspective(fov, aspect, zNear, zFar)

    const cameraPosition = [0, 0, 2]
    const up = [0, 1, 0]
    const target = [0, 0, 0]
    const viewMatrix = mat4.lookAt(cameraPosition, target, up)
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix)

    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView()

    const encoder = device.createCommandEncoder({
      label: 'render quad encoder',
    })
    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)

    const texture = device.importExternalTexture({source: video})

    objectInfos.forEach(({sampler, matrix, uniformBuffer, uniformValues}, i) => {
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: sampler},
          {binding: 1, resource: texture},
          {binding: 2, resource: {buffer: uniformBuffer}},
        ],
      })

      const xSpacing = 1.2
      const ySpacing = 0.5
      const zDepth = 1

      const x = (i % 2) - 0.5
      const y = i < 2 ? 1 : -1

      mat4.translate(viewProjectionMatrix, [x * xSpacing, y * ySpacing, -zDepth * 0.5], matrix)
      mat4.rotateX(matrix, 0.25 * Math.PI * Math.sign(y), matrix)
      mat4.scale(matrix, [1, -1, 1], matrix)
      mat4.translate(matrix, [-0.5, -0.5, 0], matrix)

      // copy the values from JavaScript to the GPU
      device.queue.writeBuffer(uniformBuffer, 0, uniformValues)

      pass.setBindGroup(0, bindGroup)
      pass.draw(6) // call our vertex shader 6 times
    })

    pass.end()

    const commandBuffer = encoder.finish()
    device.queue.submit([commandBuffer])

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)

  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const canvas = entry.target
      const width = entry.contentBoxSize[0].inlineSize
      const height = entry.contentBoxSize[0].blockSize
      canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D))
      canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D))
    }
  })
  observer.observe(canvas)
})()
