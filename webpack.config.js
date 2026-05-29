const path = require('path');
const nodeExternals = require('webpack-node-externals'); // 🚀 引入一键排除插件

/** @type {import('webpack').Configuration} */
module.exports = {
  // 目标环境：Node.js
  target: 'node',

  // 入口文件：认准我们的发动机启动器
  entry: './src/index.ts',

  // 输出配置
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js',
    library: {
      type: 'commonjs', // 🚀 升级为 Webpack 5 标准写法
    },
  },

  // 模块解析
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    // 路径别名配置（跟你的 tsconfig 完美对齐）
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  // 🚀 工业级防漏排除：自动将 package.json 里的所有第三方依赖踢出打包体积
  externals: [nodeExternals()],

  // 模块规则
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.json',
          },
        },
      },
    ],
  },

  // 开发工具：线上报错时也能精准定位到具体的 TS 源码行数
  devtool: 'source-map',
};