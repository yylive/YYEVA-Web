import path from 'path'
import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
const src = path.join(process.cwd(), 'src')
export default defineConfig(({mode}) => {
  const isDev = mode === 'development'
  // const jsEnv = mode !== 'development' ? '?no-requirev&no-check' : '?dev&no-requirev&no-check'
  return {
    resolve: {
      alias: [
        {find: /^~/, replacement: ''},
        {find: 'src/', replacement: path.join(src, '/').replace(/\\/gi, '/')},
        //
        // {find: 'react/jsx-dev-runtime', replacement: 'react/jsx-dev-runtime'},
        // {find: 'react', replacement: `https://esm.sh/react`},
        // {find: 'react-dom/', replacement: `https://esm.sh/react-dom`},
        // {find: 'antd', replacement: `https://esm.sh/antd?bundle`},
        // {find: '@ant-design/icons', replacement: `https://esm.sh/@ant-design/icons?bundle`},
        // {find: '@ant-design/pro-components', replacement: `https://esm.sh/@ant-design/pro-components?bundle`},
        // {find: '@ant-design/pro-layout', replacement: `https://esm.sh/@ant-design/pro-layout?bundle`},
      ],
    },
    plugins: [react()],
    build: {
      sourcemap: !isDev,
      external: [
        'antd',
        // '@ant-design/icons', '@ant-design/pro-components', '@ant-design/pro-layout'
      ],
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
