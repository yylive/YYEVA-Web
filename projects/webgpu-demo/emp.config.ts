import {defineConfig} from '@empjs/cli'
export default defineConfig(() => {
  return {
    server: {
      https: true,
    },
    chain(config) {
      config.merge({
        module: {
          rule: {
            wgsl: {
              test: /\.wgsl/,
              loader: require.resolve('webpack-wgsl-loader'),
            },
          },
        },
      })
    },
  }
})
