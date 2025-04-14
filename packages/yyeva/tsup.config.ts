import {defineConfig} from 'tsup'
import pkg from './package.json'
export default defineConfig(({watch}) => {
  const isDev = !!watch
  const env = isDev ? 'dev' : 'prod'
  return {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm', 'cjs'],
    platform: 'browser',
    splitting: true,
    sourcemap: true,
    minify: !isDev ? 'terser' : false,
    clean: true,
    dts: true,
    shims: true,
    define: {
      'process.env.ENV': JSON.stringify(env),
      'process.env.PKGVERSION': JSON.stringify(pkg.version),
    },
    esbuildOptions(options, context) {
      options.legalComments = 'none'
      options.keepNames = false
      // options.minifySyntax = !isDev
      // options.minifyWhitespace = !isDev
      // options.minifyIdentifiers = !isDev
    },
    // outExtension({format}) {
    //   return {
    //     js: '.js',
    //     // dts: `.d.ts`,
    //   }
    // },
  }
})
