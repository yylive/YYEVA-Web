# YY-EVA <sup>web</sup> 🎁

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]
[![github][github-src]][github-href]

Language: [English](./README.en.md)

## 📦安装
```shell
npm i yyeva
# or
yarn add yyeva
# or
pnpm add yyeva
```
## 💿使用
```typescript
import {yyEva,YYEvaType} from 'yyeva'
let player:YYEvaType = await yyEva({
	container,// Html Element
	videoUrl,// Video Url
	effects: {
	  // 自定义字体信息 fontStyle参考https://www.w3schools.com/jsref/canvas_font.asp
	  text1: {text: '自定义text1', fontStyle: '18px Microsoft YaHei', fontColor: '#ff0000'},
          text2: {text: '自定义text2', fontStyle: '20px Microsoft YaHei', fontColor: 'green'},
        },
	// Events
	onStart(){},
	onStop(){},
	onEnd(){},
	onLoopCount(args){},
	onPause(){},
	onResume(){},
	onProcess(){},
	onError(){},
})
player.start() // start player
player.stop() // pause player
player.destroy() // destroy player
```
## 配置
| 选项            | 作用     | 默认值    |必填|
|---------------|--------|--------|--------|
|videoUrl|mp4地址||*|
|hevcUrl|mp4地址 [hevc、h265]|不支持h265会降级到h264||
|loop|是否循环、循环次数 |true||
|videoID|适配微信等需要预先声明的容器,否则需要重复点击授权|||
|mode|显示方式 横竖屏|根据父容器等比缩放||
|container|html对象 推荐 div||*|
|fps|礼物播放动画帧数|根据素材获取||
|usePrefetch|是否边播边下载、带Key素材默认开启|true||
|useBitmap|利用bitmap代替 img element|true||
|useAccurate|启用 requestVideoFrameCallback,自降级|false|，开启后在个别安卓手机可能出现卡顿现象|
|useVideoDBCache|indexdb 缓存视频|true||
|useFrameCache|缓存视频帧|5||
|useOfsRender|利用多canvas渲染|true||
|mute|静音播放、根据环境自动调整|true||
|alphaDirection|非带Key视频，适配alpha 位置|`alphaDirection`||
|renderType|渲染模式、canvas2d 带Key模式开发中|`canvas2d`||
|resizeCanvas|canvas 显示方式, 'percent' -- 铺满, 'percentW'- 横向铺满, 'percentH' - 垂直铺满, 'size'- 不缩放|`width 100%` `height 100%`||
|logLevel|日志级别|`info`||
|showPlayerInfo|是否控制台显示播放状态|||
|effects|根据素材传入相应的素材内容|||
|effects.fontColor|定义传入素材的字体颜色|||
|effects.fontSize|定义传入素材的字体大小|||
|checkTimeout|检查播放超时|`fasle`||
|onRequestClickPlay|微信 或者 `mute=false` 会触发这个事件，不定义则显示默认样式|[类型](https://github.com/yylive/YYEVA-Web/blob/main/packages/yyeva/src/type/mix.ts#L173) [参考 clickPlayBtn](https://github.com/yylive/YYEVA-Web/blob/main/packages/yyeva/src/helper/polyfill.ts#L39)||

## 注意
+ 正式环境 确保 `logLevel` 为 `info` 避免内存泄露

## 兼容性
综合测试 整理了主流的手机 通过情况 [详细](https://github.com/yylive/YYEVA-Web/blob/main/docs/device.md)

### 微信 WEB & H5
> IOS 与安卓都需要设置 `videoID` 避免重复授权点击 如:

```javascript
yyeva({
	videoID: 'yyeva_full_screen_position'
})
...
yyeva({
	videoID: 'yyeva_right_top_position'
})
```
#### IOS
微信 ios 已经验证通过，可以自动播放

兼容ios微信，需要在`WeixinJSBridgeReady`微信h5内置事件中，提前创建`video`,并且预设`id` 
```javascript
    document.addEventListener('WeixinJSBridgeReady', () => {
        window.yyeva_wx_is_ready = true //告诉 yyeva ios wchat 已经 ready
        const video = document.createElement('video')
        video.setAttribute('id', 'YYEVA_VIDEO_ID')
        document.body.appendChild(video)
        video.style.visibility = 'hidden'
    })
```
或者引用 yyeva 的兼容方法 实现 [demo](https://github.com/yylive/YYEVA-Web/blob/main/projects/es5-demo/src/App.tsx#L3) 如： 
```js
import {wechatPolyfill} from 'yyeva'
wechatPolyfill.initVideoIDPosition(['yyeva_right_top_position', 'yyeva_full_screen_position'])
```

#### 安卓
微信安卓 需要手动点击 触发授权, 可根据 `onRequestClickPlay` 事件进行自定义 `点击事件` 提示

### UC & 夸克 
多礼物同时播放存在 卡顿问题，正在推进解决,临时解决可以通过队列错峰播放!

### 微信小程序 
[NPM 安装包](https://www.npmjs.com/package/yyeva-wechat)


<!-- Badged -->

[npm-version-src]: https://img.shields.io/npm/v/yyeva?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/yyeva
[npm-downloads-src]: https://img.shields.io/npm/dm/yyeva?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/yyeva
[bundle-src]: https://img.shields.io/bundlephobia/minzip/yyeva?style=flat&colorA=18181B&colorB=F0DB4F
[bundle-href]: https://bundlephobia.com/result?p=yyeva
[license-src]: https://img.shields.io/github/license/yylive/YYEVA-Web.svg?style=flat&colorA=18181B&colorB=F0DB4F
[license-href]: https://github.com/yylive/YYEVA-Web/blob/main/LICENSE
[github-src]: https://img.shields.io/badge/github-YYEVA-blue?style=flat&colorA=18181B&colorB=F0DB4F
[github-href]: https://github.com/yylive/YYEVA-Web