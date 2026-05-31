declare namespace NodeJS {
  // 环境变量
  interface ProcessEnv {
    // Server
    NODE_ENV: "development" | "production" | "test";
    PORT: string;

    // API
    API_PREFIX?: string;

    // Database
    DATABASE_URL: string;
    PROD_DATABASE_URL: string;
    TEST_DATABASE_URL: string;

    // JWT令牌
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;

    // 📬 邮件服务器配置
    SMTP_HOST: string;

    // 💡 核心修复：在大厂规范中，端口从 env 读出来默认是 string，
    // 我们限定它只能是标准的安全的 "465" 或 "587" 字符串类型，或者更通用的 string
    SMTP_PORT: "465" | "587" | string;

    SMTP_USER: string;
    SMTP_PASS: string; // 授权码

    // 兜底签名
    [key: string]: string | undefined;
  }
}
