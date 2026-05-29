// 配置对象，提供类型安全的环境变量访问
export const envConfig = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),

  // API
  apiPrefix: process.env.API_PREFIX || "/api",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",

  // 数据库
  databaseUrl: process.env.DATABASE_URL,
  testDatabaseUrl: process.env.TEST_DATABASE_URL,

  // JWT
  jwtSecret:
    process.env.JWT_SECRET ||
    "8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8a0f5c2b",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  // 发送验证码配置
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,

  // 检查必需的环境变量
  validate: () => {
    const required = ["NODE_ENV", "PORT"];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.warn(`警告：缺少环境变量: ${missing.join(", ")}`);
    }
  },
};
