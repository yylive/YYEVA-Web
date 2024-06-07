import logger from 'src/helper/logger'
import type {EventCallback} from 'src/type/mix'

export class LoopChecker {
  public loopCount = Number.POSITIVE_INFINITY
  private _endFrame? = -1

  private playedLoopCount = 0
  private lastFrameIndex = 0

  public onEnd: EventCallback
  public onLoopCount: EventCallback

  constructor(loop: boolean | number, endFrame?: number) {
    const type = typeof loop
    if (type === 'boolean') {
      this.loopCount = loop ? Number.POSITIVE_INFINITY : 1
    } else if (type === 'number') {
      this.loopCount = Number(loop)
    }

    if (endFrame !== undefined) {
      this._endFrame = endFrame
    }

    // logger.info('[LoopChecker] this._loopCount=', this.loopCount, ', loop=', loop)
  }

  reset(): void {
    this.playedLoopCount = 0
    this.lastFrameIndex = 0
  }

  public setEndFrame(value: number) {
    logger.debug('[LoopChecker]setEndFrame value=', value)
    if (value !== undefined) {
      this._endFrame = value
    }
  }

  private checkFrame(frame: number) {
    if (this._endFrame > 10) {
      return (
        this.lastFrameIndex < this._endFrame &&
        this.lastFrameIndex > this._endFrame / 2 &&
        (frame >= this._endFrame || frame <= this._endFrame / 2)
      )
    } else {
      return (this.lastFrameIndex < this._endFrame || this.lastFrameIndex > 10) && frame >= this._endFrame && frame < 10
    }
  }

  public updateFrame(frame: number) {
    if (this.checkFrame(frame)) {
      logger.info(
        '[LoopChecker] this.playedLoopCount=',
        this.playedLoopCount,
        ', this.lastFrameIndex=',
        this.lastFrameIndex,
        ', frame',
        frame,
        ', endFrame=',
        this._endFrame,
        ', this.loopCount=',
        this.loopCount,
      )

      this.playedLoopCount = this.playedLoopCount + 1
      this.onLoopCount && this.onLoopCount({count: this.playedLoopCount})

      if (this.playedLoopCount === this.loopCount) {
        // logger.info('[LoopChecker] finished.... this.playedLoopCount=', this.playedLoopCount)
        this.onEnd && this.onEnd()
        return false
      }
    }

    this.lastFrameIndex = frame
    return true
  }
}
