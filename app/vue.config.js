module.exports = {
  publicPath: '/',
  transpileDependencies: [
    'viem',
    'abitype',
    '@noble/curves',
    'ox'
  ],chainWebpack: (config) => {
    config.module
      .rule('js')
      .test(/\.js$/)
      .include
      .add(/node_modules\/(viem|abitype|ox|@noble\/curves)/)
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .end();
  },
}