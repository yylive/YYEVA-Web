import {inflate} from 'zlib.es'
import {VideoAnimateType} from 'src/type/mix'
import {logger} from 'src/helper/logger'
const yyExp = new RegExp('yyeffectmp4json\\[\\[(.*?)\\]\\]yyeffectmp4json')
class Parser {
  exp: any
  constructor() {
    this.exp = new RegExp('eJzt3U1v20gMgOH', 'g')
  }
  // base64Regex(exact?: boolean): RegExp {
  //   const regex = '(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)'
  //   return exact ? new RegExp(`(?:^${regex}?$)`) : new RegExp(regex, 'g')
  // }
  getdata(raw: string): VideoAnimateType | undefined {
    try {
      const mc = raw.match(yyExp)
      if (!mc) return undefined
      const zlibBase64String = mc[1]
      const u8 = this.inflate(zlibBase64String)
      let d: any = this.unit8Tostring(u8)
      d = JSON.parse(d)
      logger.debug('[ParserGetData]', d)
      return d
    } catch (e) {
      logger.warn(e)
      return undefined
    }
  }
  base64ToArrayBuffer(base64: string) {
    const binary_string = window.atob(base64)
    const len = binary_string.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
  }
  unit8Tostring(u8data: Uint8Array) {
    return new TextDecoder().decode(u8data)
  }
  inflate(str: string): Uint8Array {
    const u8data = inflate(new Uint8Array(this.base64ToArrayBuffer(str)))
    return u8data
  }
}
export default new Parser()
