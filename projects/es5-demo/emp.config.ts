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
  }
})
