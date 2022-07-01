import path from 'path'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
const src = path.join(process.cwd(), 'src')
export default defineConfig(env => {
  const isDev = env.mode === 'development'
  return {
    resolve: {
      alias: [
        {find: /^~/, replacement: ''},
        {find: 'src/', replacement: path.join(src, '/').replace(/\\/gi, '/')},
      ],
    },
    plugins: [react()],
    server: {
      port: 3001,
      host: true,
    },
    preview: {
      port: 3001,
      host: true,
    },
  }
})
