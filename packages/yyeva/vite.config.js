import path from 'path'
import {getBabelOutputPlugin} from '@rollup/plugin-babel'
import pkg from './package.json'
import {defineConfig} from 'vite'
import terser from '@rollup/plugin-terser'
//
const root = process.cwd()
const src = path.join(root, 'src')
const appRoot = src => path.resolve(root, src)

const libName = 'yyeva'
const libFormat = process.env.FORMAT
const babelPlugin = getBabelOutputPlugin({
  allowAllFormats: true,
  comments: false,
  presets: [
    [
      '@babel/preset-env',
      {
        // debug: true,
        // modules: true,
        // useBuiltIns: 'entry',
        targets: {
          browsers: ['Android >= 4.4', 'iOS >= 9.0'],
        },
      },
    ],
  ],
  plugins: [['@babel/plugin-transform-runtime']],
})
const buildFormat = () => {
  const o = {
    dir: 'dist',
    format: libFormat,
    name: libName,
    inlineDynamicImports: true,
    sourcemap: true,
    entryFileNames: () => `${libFormat}/${libName}.js`,
    chunkFileNames: () => `${libFormat}/[name].js`,
  }
  if (libFormat === 'umd') {
    o.name = libName
  }
  if (libFormat !== 'esm') {
    o.exports = 'named'
  }
  return o
}
const output = [buildFormat()]
const plugins = []
if (libFormat !== 'esm') {
  plugins.push(babelPlugin)
}

export default defineConfig(({mode}) => {
  const isDev = mode === 'dev'
  if (!isDev) {
    plugins.push(terser())
  }
  return {
    define: {
      'import.meta.env.PKGVERSION': `"${pkg.version}"`,
    },
    plugins: [],
    resolve: {
      alias: [
        {find: /^~/, replacement: ''},
        {find: 'src/', replacement: path.join(src, '/').replace(/\\/gi, '/')},
      ],
    },
    build: {
      emptyOutDir: libFormat === 'esm',
      sourcemap: true,
      lib: {
        entry: appRoot('src/index.ts'),
        name: libName,
        fileName: () => `${libName}.js`,
      },
      rollupOptions: {
        external: [],
        plugins,
        output,
      },
    },
  }
})
