import path from 'path'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
const src = path.join(process.cwd(), 'src')
export default defineConfig(({mode}) => {
  const isDev = mode === 'development'
  return {
    resolve: {
      alias: [
        {find: /^~/, replacement: ''},
        {find: 'src/', replacement: path.join(src, '/').replace(/\\/gi, '/')},
      ],
    },
    plugins: [react()],
    build: {
      sourcemap: !isDev,
    },
    server: {
      port: 3001,
      host: true,
      // https: true,
    },
    preview: {
      port: 3001,
      host: true,
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          // additionalData: '@root-entry-name: default;',
        },
      },
    },
  }
})
