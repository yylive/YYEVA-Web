const {defineConfig} = require('@efox/emp')
module.exports = defineConfig(() => {
  return {
    server: {
      // https: true,
      port: 3000,
    },
    moduleTransform: {
      include: [/yyeva/],
    },
    html: {
      title: 'YYEVA ES5 DEMO',
    },
  }
})
