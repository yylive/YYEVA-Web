import logger from 'src/helper/logger'
import {EventCallback} from 'src/type/mix'

export class LoopChecker {
  public loopCount = Infinity

  private playedLoopCount = 0
  private lastFrameIndex = 0

  public onEnd: EventCallback

  constructor(loop: boolean | number) {
    const type = typeof loop
    if (type === 'boolean') {
      this.loopCount = loop ? Infinity : 1
    } else if (type === 'number') {
      this.loopCount = Number(loop)
    }

    // logger.info('[LoopChecker] this._loopCount=', this.loopCount, ', loop=', loop)
  }

  public updateFrame(frame: number) {
    if (this.lastFrameIndex > frame && this.loopCount > 1 && this.loopCount != Infinity) {
      /* logger.info(
        '[LoopChecker] this.playedLoopCount=',
        this.playedLoopCount,
        ', this.lastFrameIndex=',
        this.lastFrameIndex,
        ', frame',
        frame,
        ', this.loopCount=',
        this.loopCount,
      ) */
      this.playedLoopCount = this.playedLoopCount + 1
      if (this.playedLoopCount == this.loopCount) {
        // logger.info('[LoopChecker] finished.... this.playedLoopCount=', this.playedLoopCount)
        this.onEnd && this.onEnd()
        return false
      }
    }

    this.lastFrameIndex = frame
    return true
  }
}
