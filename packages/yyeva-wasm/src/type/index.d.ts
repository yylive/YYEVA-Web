declare interface RendererClassI {
  setPlay: (isPlayer: boolean) => void
  setup: (canvas: HTMLCanvasElement, video?: HTMLVideoElement) => void
  render: () => void
  destroy: () => void
}

declare module 'web-worker:*' {
  const WorkerFactory: new () => Worker
  export default WorkerFactory
}

declare global {
  interface Window {
    WeixinJSBridge?: any
  }
}
