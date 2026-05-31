import dotenv from "dotenv";
import path from "path";

// 1. 始终加载 .env 文件（但根据环境决定是否“覆盖”系统环境变量）
// 这样无论开发还是生产，process.env 都能获取到 .env 里的定义
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const envConfig = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  apiPrefix: process.env.API_PREFIX || "/api",

  // 2. 逻辑分流：根据环境选择对应的数据库地址
  // 如果是生产环境，优先读 PROD_DATABASE_URL，否则读 DATABASE_URL
  databaseUrl:
    process.env.NODE_ENV === "production"
      ? process.env.PROD_DATABASE_URL
      : process.env.DATABASE_URL,

  testDatabaseUrl: process.env.TEST_DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET || "default_fallback_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,

  validate: () => {
    // 动态校验：根据当前环境校验对应的变量
    const currentUrl =
      process.env.NODE_ENV === "production"
        ? process.env.PROD_DATABASE_URL
        : process.env.DATABASE_URL;

    if (!currentUrl) {
      console.error(
        `💥 [致命错误] 当前模式 [${process.env.NODE_ENV}] 缺少对应的数据库地址配置！`,
      );
      process.exit(1);
    }
  },
};
