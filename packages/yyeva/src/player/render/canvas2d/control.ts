import {isOffscreenCanvasSupported} from 'src/helper/utils'
export class Canvas2dControl {
  createCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return isOffscreenCanvasSupported() && !!self.createImageBitmap
      ? new OffscreenCanvas(300, 300)
      : document.createElement('canvas')
  }
  removeCanvas(ofs: HTMLCanvasElement | OffscreenCanvas) {
    if (ofs instanceof HTMLCanvasElement) {
      ofs.remove()
    } else {
      ofs = undefined as any
    }
  }
  get2dContext(ofs: HTMLCanvasElement | OffscreenCanvas) {
    return ofs.getContext('2d', {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D
  }
}
