export interface EntityImpl {
  fps: number
  destroy: () => void
  setup: () => Promise<void>
  setConfig: (data: any) => void
}
