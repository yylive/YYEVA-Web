import {defineConfig} from '@empjs/cli'
import lightningcssPlugin from '@empjs/plugin-lightningcss'
import pluginReact from '@empjs/plugin-react'
export default defineConfig(() => {
  return {
    plugins: [pluginReact(), lightningcssPlugin()],
    html: {
      template: 'src/index.html',
    },
    server: {
      port: 3001,
      open: false,
      https: true,
    },
  }
})
