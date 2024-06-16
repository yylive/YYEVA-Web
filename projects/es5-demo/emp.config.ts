import {defineConfig} from '@empjs/cli'
import pluginReact from '@empjs/plugin-react'
// import lightningcssPlugin from '@empjs/plugin-lightningcss'
export default defineConfig(() => {
  return {
    plugins: [pluginReact()],
    server: {
      port: 3002,
      open: false,
      https: true,
    },
    build: {
      sourcemap: true,
    },
    // debug: {
    //   showRsconfig: true,
    // },
    // chain(config) {
    //   config.merge({
    //     module: {
    //       rule: {
    //         sourceMap: {
    //           test: /\.[tj]sx?$/,
    //           enforce: 'pre',
    //           use: {
    //             sourceMapLoader: {
    //               loader: require.resolve('source-map-loader'),
    //               options: {
    //                 filterSourceMappingUrl: (url, resourcePath) => {
    //                   console.log(url, resourcePath)
    //                   if (/broker-source-map-url\.js$/i.test(url)) {
    //                     return false
    //                   }

    //                   if (/keep-source-mapping-url\.js$/i.test(resourcePath)) {
    //                     return 'skip'
    //                   }

    //                   return true
    //                 },
    //               },
    //             },
    //           },
    //         },
    //       },
    //     },
    //   })
    // },
  }
})
