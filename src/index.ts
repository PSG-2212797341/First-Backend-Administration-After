import 'dotenv/config';
import express from 'express';
import { connectDatabase } from './database';
import totalRoutes from './routes/totalRoutes';
import { errorProduct, errorRequest } from './middlewares/error';
import dynamicFormRoutes from './routes/dynamicFormRoutes';

// 配置对象，提供类型安全的环境变量访问
const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // API
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Application
  appName: process.env.APP_NAME || 'Express TypeScript API',
  appVersion: process.env.APP_VERSION || '1.0.0',
  
  // 检查必需的环境变量
  validate: () => {
    const required = ['NODE_ENV', 'PORT'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      console.warn(`警告：缺少环境变量: ${missing.join(', ')}`);
    }
  }
};

// 验证环境变量
config.validate();

const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use(`${config.apiPrefix}/v1/total`, totalRoutes);
app.use(`${config.apiPrefix}/v1/dynamic-forms`, dynamicFormRoutes);

// 404处理
app.use(errorRequest);

// 错误处理中间件
app.use(errorProduct);

// 启动服务器函数
async function startServer() {
  try {
    // 1. 先连接数据库
    await connectDatabase();
    console.log('✅ 数据库连接成功');
    
    // 2. 启动服务器
    app.listen(config.port, () => {
      console.log(`🚀 服务器运行在 http://localhost:${config.port}`);
      console.log(`📁 环境: ${config.nodeEnv}`);
      console.log(`🗄️  数据库: ${process.env.DATABASE_URL ? '已配置' : '未配置'}`);
    });
    
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});
