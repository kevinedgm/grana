// webpack 5 con su minificador por defecto (terser) en production; DefinePlugin pone process.env.NODE_ENV según el modo
const path = require('node:path')
module.exports = (env, argv) => ({
  context: __dirname,
  entry: env.todas ? './app-todas/main.js' : './app/main.js',
  output: { path: path.join(__dirname, 'out', `wp-${env.todas ? 'todas-' : ''}${argv.mode}`), filename: 'main.js', clean: true },
  devtool: false,
  performance: { hints: false },
  resolve: { conditionNames: ['import', 'module', 'browser', 'default'] }
})
