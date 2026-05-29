// 日志记录相关配置
import winston from "winston";
import "winston-daily-rotate-file";

// 1. 定义日志的通用格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }), // 自动捕获并解析错误的堆栈信息
  winston.format.splat(),
  winston.format.json(), // 生产环境下输出纯 JSON 字符串，完美适配 ELK 等日志分析系统
);

// 2. 正常运行日志配置（只记录 info 及以下级别，如用户登录、发信审计）
const infoTransport = new winston.transports.DailyRotateFile({
  filename: "logs/auth-info-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true, // 历史日志自动压缩成 .gz，极大节省服务器硬盘
  maxSize: "20m", // 单个文件超过 20M 自动切分
  maxFiles: "14d", // 正常日志保留 14 天
  level: "info",
});

// 3. 错误日志配置（专门收集 error 级别，高优先级排错）
const errorTransport = new winston.transports.DailyRotateFile({
  filename: "logs/auth-error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d", // 错误日志更重要，保留 30 天
  level: "error",
});

// 4. 创建全局 Logger 实例
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  format: logFormat,
  transports: [infoTransport, errorTransport],
});

// 💡 大厂人性化规范：如果是本地开发环境，同时把日志漂亮地打印到控制台
if (process.env.NODE_ENV === "development") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // 控制台日志带颜色（info是绿，error是红）
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `[${timestamp}] ${level}: ${message} ${stack ? `\n${stack}` : ""}`;
        }),
      ),
    }),
  );
}
