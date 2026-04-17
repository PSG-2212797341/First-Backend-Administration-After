const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  // 目标环境：Node.js
  target: 'node',

  // 入口文件
  entry: './src/index.ts',

  // 输出配置
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js',
    // Node.js需要CommonJS模块
    libraryTarget: 'commonjs2',
  },

  // 模块解析
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    // 路径别名配置
    alias: {
      // 将@指向src目录
      '@': path.resolve(__dirname, 'src'),
      // 可以添加更多别名
      '@controllers': path.resolve(__dirname, 'src/controllers'),
      '@models': path.resolve(__dirname, 'src/models'),
      '@routes': path.resolve(__dirname, 'src/routes'),
      '@middlewares': path.resolve(__dirname, 'src/middlewares'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
    },
  },

  // 排除Node.js内置模块和node_modules
  externals: {
    // 使用函数更精确地控制外部化
    express: 'commonjs express',
    mongoose: 'commonjs mongoose',
  },

  // 模块规则
  module: {
    rules: [
      // TypeScript文件
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

  // 开发工具
  devtool: 'source-map',
};
