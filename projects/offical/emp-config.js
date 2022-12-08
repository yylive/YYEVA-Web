const {defineConfig} = require('@efox/emp')
const compile = require('@efox/emp-compile-swc')
//
const reactVersion = '18.2.0'
const esmVersion = 'es2018'
const esm = (name, mode, version, esmVersion, deps) =>
  `https://esm.sh/${name}${version ? '@' + version : ''}?${mode === 'development' ? 'dev' : ''}&target=${esmVersion}&${
    deps ? 'deps=' + deps : ''
  }`
//
module.exports = defineConfig(({mode}) => {
  return {
    compile,
    server: {
      port: 3001,
    },
    build: {
      sourcemap: true,
      minify: 'swc',
      target: esmVersion,
    },
    empShare: {
      name: 'yyevaOffical',
      exposes: {},
      shareLib: {
        react: esm('react', mode, reactVersion, esmVersion),
        'react-dom': esm('react-dom', mode, reactVersion, esmVersion),
        zustand: esm('zustand', mode, '4', esmVersion, `react@${reactVersion},react-dom@${reactVersion}`),
      },
    },
    html: {
      title: 'YYEVA - 可插入动态元素的MP4动效播放器解决方案',
      favicon: 'src/img/logo.png',
      tags: {
        headTags: [
          `<meta name="author" content="Ken Xu" rel="https://github.com/ckken" />`,
          `<script>
        var _hmt = _hmt || [];
        (function() {
          var hm = document.createElement("script");
          hm.src = "https://hm.baidu.com/hm.js?1c6df152448e07a897bc92209bfe0381";
          var s = document.getElementsByTagName("script")[0]; 
          s.parentNode.insertBefore(hm, s);
        })();
        </script>`,
        ],
      },
      files: {
        css: ['https://cdn.jsdelivr.net/npm/antd@4.22.8/dist/antd.min.css'],
      },
    },
    debug: {
      clearLog: false,
    },
  }
})
