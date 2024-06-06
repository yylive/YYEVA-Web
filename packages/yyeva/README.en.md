# YY-EVA <sup>web</sup> 🎁
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]
[![github][github-src]][github-href]

Language: [中文](./README.md)

## 📦 Install
```shell
npm i yyeva
# or
yarn add yyeva
# or
pnpm add yyeva
```
## 💿 Usage
```typescript
import {yyEva,YYEvaType} from 'yyeva'
let player:YYEvaType = await yyEva({
	container,// Html Element
	videoUrl,// Video Url
	effects: {
	  //  fontStyle doc: https://www.w3schools.com/jsref/canvas_font.asp
          text1: {text: 'text example 1st', fontStyle: '18px arial', fontColor: '#ff0000'},
          text2: {text: 'text example 2nd', fontStyle: '20px arial', fontColor: 'green'},
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
## configuration
| options            | effect     | defaults    |required|
|---------------|--------|--------|--------|
|videoUrl|mp4 address||*|
|hevcUrl|mp4 address [hevc、h265]|||
|loop|loop or loop count |true||
|videoID|Adapt to containers that require prior declaration such as WeChat, otherwise you need to repeatedly click on authorization|||
|mode|'AspectFill' / 'AspectFit' / 'contain' / 'cover'|scale proportionally according to the parent container||
|container|dom container||*|
|fps|animation frame|get from video source||
|usePrefetch|whether to download while playing, the material with "key" is enabled by default|true||
|useBitmap|use bitmaps instead of img elements|true||
|useAccurate|in the case of supporting requestVideoFrameCallback, use requestVideoFrameCallback first|false||
|useVideoDBCache|enable indexDB video caching|true||
|useFrameCache|number of video frame buffers|5||
|useOfsRender|enable multithreaded rendering|true||
|mute|silent playback, automatic adjustment according to the environment|true||
|alphaDirection|adjust alpha position for video without keys|`alphaDirection`||
|renderType|render mode 'webgl' / 'canvas2d'|`canvas2d`||
|resizeCanvas|canvas size, 'percent', 'percentW', 'percentH', 'size'|`width 100%` `height 100%`||
|logLevel|log level|`info`||
|showPlayerInfo|whether the console shows the playback status|||
|effects|additional material content|||
|effects.fontColor|define the font color of the effects material|||
|effects.fontSize|define the font size of the effects material|||
|checkTimeout|check play timeout|`fasle`||
|onRequestClickPlay|triggered when the video cannot be played automatically, such as WeChat or "mute=false"|[type](https://github.com/yylive/YYEVA-Web/blob/main/packages/yyeva/src/type/mix.ts#L173) </br> [refer to clickPlayBtn](https://github.com/yylive/YYEVA-Web/blob/main/packages/yyeva/src/helper/polyfill.ts#L39)||

## attention
+ make sure `logLevel` is `info` to avoid memory leaks in production environments.

## compatibility
compatibility list obtained after comprehensive testing [detail](https://github.com/yylive/YYEVA-Web/blob/main/docs/device.en.md)
### WeChat H5
#### IOS
WeChat ios has been verified and can be played automatically
#### android
WeChat Android needs to be manually clicked or customized according to the `onRequestClickPlay` event

### Wechat Miniprogram 
[NPM Package](https://www.npmjs.com/package/yyeva-wechat)


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