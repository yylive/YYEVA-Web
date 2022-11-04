# YY-EVA <sup>baidu</sup> 🎁 
> YYEVA 动效播放器 百度小程序 动态库
## 配置 
相关配置与 [web配置](https://github.com/yylive/YYEVA-Web/tree/main/packages/yyeva) 保持一致

## 使用 
### app.js
```json
{
    "dynamicLib": {
        "ePlayerLib": {
            "provider": "e-svga"
        }
    }
}
```
### 页面逻辑代码 
>  以 pages/index 为例
+ index.json
```json
{
    "usingComponents": {
        "yyeva": "dynamicLib://ePlayerLib/e-video"
    }
}

```
+ index.js
```js
Page({
  data: {
    yyevaOptions: {},
  },
  onLoad() {
    this.setData({yyevaOptions: {
    videoUrl: '...', //资源地址
    useMetaData: true, //启动 metadata 
    effects: {}, // 业务内容 k 为 effectTag
    mode: 'AspectFill',// 竖屏适配
    }})
  },
  onYYEvaEvent({eventName, op}) {
   
    switch (eventName) {
      case 'onStart':
        break
      case 'onStop':
        break
      case 'onResume':
        break
      case 'onPause':
        break
      case 'onEnd':
        // 播放结束后 继续播放新动画
        this.setData({yyevaOptions: {...}})
        break
      case 'onProcess':
        break
    }
  },
})
```
+ index.swan 
```html
<yyeva
    class="full-screen"
    options="{{yyevaOptions}}"
    bindEvent="onYYEvaEvent" />
```
+ index.css
> 全屏礼物为主 可以根据需求自定义礼物播放样式
```css 
.full-screen{
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

## 小程序系列 
+ [微信](https://www.npmjs.com/package/yyeva-wechat)
+ 百度
+ 抖音 (规划中)
+ 支付宝 (规划中)