import {defineConfig} from '@empjs/cli'
import pluginReact from '@empjs/plugin-react'
export default defineConfig(() => {
  return {
    plugins: [pluginReact()],
    server: {
      port: 3000,
    },
    html: {
      title: 'YYEVA ES5 DEMO',
    },
  }
})
