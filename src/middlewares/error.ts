import { Request, Response, NextFunction } from "express";
import { envConfig } from "../config/envConfig";
import { logger } from "../config/logger"; // 🚀 1. 引入你的中央 Winston 日志实例

/**
 * 1. 全局错误处理中间件 (统一捕获未处理的运行时异常)
 */
export const errorProduct = (
  error: any, // 💡 换成 any，完美兼容 Error、ZodError 或各类自定义业务异常
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // 🚀 2. 枪毙 console.error，用工业级 Winston 轰炸日志文件
  // 该方法会自动将错误描述及最底层的完整代码堆栈（Stack Trace）优雅地写入 logs/auth-error-xxxx.log
  logger.error(
    `💥 [统一异常拦截] 路径: ${req.method} ${req.path} | 异常详情:`,
    error,
  );

  // 防御性：如果响应头已经发送出去了，直接交给 Express 内置的处理器，避免重复响应报错
  if (res.headersSent) {
    return _next(error);
  }

  const isDevelopment = envConfig.nodeEnv === "development";
  const statusCode = error.status || 500;

  // 🚀 3. 落地大厂风控防泄露响应标准
  res.status(statusCode).json({
    success: false,
    // 💡 生产环境绝对隐藏敏感报错细节，统一提供温和且体面的模糊提示
    message: isDevelopment
      ? error.message || "内部服务器错误"
      : "系统响应异状，架构师已收到自动报警日志，请稍后再试",

    // 💡 动态字段技巧：仅在本地开发时追加 error 和 stack 帮你在 Swagger 页面上秒级排错，生产环境这两个 Key 会彻底消失
    ...(isDevelopment && {
      error: error.message,
      stack: error.stack,
    }),

    timestamp: new Date().toISOString(),
  });
};

/**
 * 2. 404 路由未找到中间件 (黑客扫描/路径防刷审计)
 */
export const errorRequest = (req: Request, res: Response) => {
  // 🚀 4. 大厂安全审计规范：用户访问不存在的路由时，触发 warn（警告）日志
  // 这样如果有人在恶意扫描你的接口（如刷密码、探测漏洞），后台日志一目了然
  logger.warn(
    `⚠️ [路由未找到] 客户端试图访问不存在的接口: ${req.method} ${req.path} | IP: ${req.ip}`,
  );

  res.status(404).json({
    success: false,
    message: `请求的 API 路由未找到，请确认请求路径 [${req.path}] 或 HTTP 方法 [${req.method}] 是否正确`,
    timestamp: new Date().toISOString(),
  });
};
