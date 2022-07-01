# YY-EVA <sup>web</sup> 🎁
<a href="https://www.npmjs.com/package/yyeva"><img src="https://img.shields.io/npm/v/yyeva.svg" alt="npm"></a>
<a href="https://emp2.netlify.app"><img src="https://img.shields.io/node/v/yyeva.svg" alt="node"></a>
<a href="https://github.com/YY-LIVE/YYEVA-Web"><img src="https://img.shields.io/badge/github-YYEVA-blue" alt="github"></a>
<a href="https://yyeva.netlify.app/"><img src="https://img.shields.io/badge/demo-YYEVA-black" alt="demo"></a>

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
	// Events
	onStart(){},
	onStop(){},
	onEnd(){},
	onPause(){},
	onResume(){},
	onProcess(){},
	onError(){},
})
player.start() // start player
player.stop() // pause player
player.destory() // dstory player
```
## 配置
| 选项            | 作用     | 默认值    |必填|
|---------------|--------|--------|--------|
|videoUrl|mp4地址||*|
|videoID|适配微信等需要预先声明的容器|e-video-wx-${now}||
|mode|显示方式 横竖屏|根据父容器等比缩放||
|container|html对象 推荐 div||*|
|fps|礼物播放动画帧数|根据素材获取||
|usePrefetch|是否边播边下载、带Key素材默认开启|true||
|useBitmap|利用bitmap代替 img element|true||
|useAccurate|启用 requestVideoFrameCallback,自降级|true||
|useVideoDBCache|indexdb 缓存视频|true||
|useFrameCache|缓存视频帧|5||
|useOfsRender|利用多canvas渲染|true||
|mute|静音播放、根据环境自动调整|true||
|alphaDirection|非带Key视频，适配alpha 位置|`alphaDirection`||
|renderType|渲染模式、canvas2d 带Key模式开发中|`canvas2d`||
|resizeCanvas|canvas 显示方式|`width 100%` `height 100%`||
|logLevel|日志级别|`info`||
|showPlayerInfo|是否控制台显示播放状态|||
|effects|根据素材传入相应的素材内容|||
|onRequestClickPlay|微信 安卓会触发这个事件，不定义则显示默认样式|`(video:HTMLVideoElement)=>void`||

## 注意
+ 正式环境 确保 `logLevel` 为 `info` 避免内存泄露

## 兼容性
综合测试 整理了主流的手机 通过情况 [详细](https://github.com/YY-LIVE/YYEVA-Web/blob/main/docs/device.md)
### 微信
#### IOS
微信 ios 已经验证通过，可以自动播放
#### 安卓
微信 安卓 需要 手动点击 或者 根据 `onRequestClickPlay` 事件进行自定义提示
