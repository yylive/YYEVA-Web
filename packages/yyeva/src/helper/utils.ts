import {getChromeVersion, isAndroid, polyfill} from './polyfill'
import {logger} from 'src/helper/logger'

/**
 * 判断链接是否 dataUrl (base64)
 * @param url
 * @returns boolean
 */
export const isDataUrl = (url: string | HTMLInputElement) => {
  if (url instanceof HTMLInputElement) return false
  const regex =
    /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i
  return regex.test(url)
}
// const currentVideoId = Date.now()
// export const getVIdeoId = url => {
//   // if (polyfill.weixin) return `e-video-wx-${currentVideoId}`
//   // // if (polyfill.quark) return `quark_${Math.round(Math.random() * 1000)}_${url}`
//   // else return url
//   return url
// }

export function isOffscreenCanvasSupported() {
  /**
+ Chrome browser version 4 to Chrome browser version 57 doesn't supports HTML5 OffscreenCanvas. Chrome browser version 58 to 70 does not support but can be enabled.
+ Mozilla Firefox browser version 2 to Mozilla Firefox browser version 43 doesn't supports HTML5 OffscreenCanvas property. Mozilla Firefox browser version 57 to 63 partially supports HTML5 OffscreenCanvas property and partial support for Firefox refers to supporting an older version for the web browser.
+ Internet Explorer browser version 6 to Internet Explorer browser version 11 doesn't supports HTML5 OffscreenCanvas property.
+ Safari browser version 3.1 to Safari browser version 12 doesn't supports supports HTML5 OffscreenCanvas.
+ Microsoft Edge browser version 12 to Microsoft Edge browser version 18 doesn't supports HTML5 OffscreenCanvas property.
+ Opera browser version 10.1 to Opera browser version 44 doesn't supports HTML5 OffscreenCanvas. Opera browser version 45 to Opera browser version 53 does not support but can be enabled.
   */
  if (isAndroid && getChromeVersion() <= 70) {
    return false
  }
  return typeof OffscreenCanvas !== 'undefined' && self.OffscreenCanvas
}

// Use a fake element
//https://phuoc.ng/collection/html-dom/measure-the-width-of-given-text-of-given-font/
export function getTextByMaxWidth(text: string, font: string, maxWidth: number) {
  // 1. 创建一个临时的、不可见的元素用于测量
  const ele = document.createElement('span'); // 使用 span 更适合测量行内文本

  // 2. 设置样式使其不影响页面布局
  ele.style.position = 'absolute';
  ele.style.visibility = 'hidden';
  ele.style.whiteSpace = 'nowrap';
  // ele.style.left = '-9999px'; // visibility: hidden 已经足够

  // 3. 设置字体和初始文本
  ele.style.font = font;
  ele.textContent = text; // 使用 textContent 更高效，因为它不解析HTML

  // 4. 将元素添加到 body 中以进行计算
  document.body.appendChild(ele);

  // 5. 初始检查：如果原始文本已经符合要求，直接返回
  // 使用 offsetWidth 更直接，它返回一个整数，无需 parseInt
  if (ele.offsetWidth <= maxWidth) {
    document.body.removeChild(ele);
    return text;
  }

  // 6. 如果文本太长，则开始缩减
  let len = text.length;
  let truncatedText = text;

  // 循环条件：宽度仍然超出 并且 还有字符可以移除
  while (ele.offsetWidth > maxWidth && len > 0) {
    len--; // 减少一个字符
    truncatedText = text.substring(0, len) + '...';
    ele.textContent = truncatedText;
    // 调试日志
    // console.log(`getTextByMaxWidth.. width=${ele.offsetWidth}, str=${truncatedText}`);
  }

  // 7. 清理临时元素
  document.body.removeChild(ele);

  // 8. 返回结果
  // 如果循环是因为 len=0 结束的（即"..."也超宽），则返回"..."作为最短可能值
  return truncatedText;
}
