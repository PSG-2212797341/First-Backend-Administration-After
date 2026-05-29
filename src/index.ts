// src/index.ts
import { Server } from "http";
import "dotenv/config";
import { app } from "./app"; // 🎯 1. 引入组装好的 app 实例
import { connectDatabase } from "./server";
import { envConfig } from "@/config/envConfig";
import { logger } from "@/config/logger";

let server: Server;

// 启动服务器函数
async function startServer() {
  try {
    // 1. 先连接数据库
    await connectDatabase();
    logger.info("🚀 [基础设施] MongoDB 数据库集群连接成功");

    // 2. 启动服务器并保存实例
    server = app.listen(envConfig.port, () => {
      logger.info(
        `✨ [系统启航] 核心后端服务已成功跑起来了！\n` +
          `   📍 访问地址: http://localhost:${envConfig.port}\n` +
          `   📁 运行环境: [${envConfig.nodeEnv}]\n` +
          `   🗄️  数据库Url: ${envConfig.databaseUrl ? "已成功配置" : "未配置"}\n` +
          `   📝 契约中心: http://localhost:${envConfig.port}/api-docs`,
      );
    });
  } catch (error) {
    logger.error("💥 [致命错误] 后端核心服务器启动失败，进程被迫中止:", error);
    process.exit(1);
  }
}

// 统一的优雅关闭处理函数
async function gracefulShutdown(signal: string) {
  logger.warn(
    `⬇️ [进程管控] 收到系统的 [${signal}] 信号，开始执行工业级优雅关闭程序...`,
  );

  if (!server) {
    logger.info("ℹ️ [进程管控] 服务器实例未建立，直接安全退出进程");
    process.exit(0);
  }

  server.close(async () => {
    logger.info(
      "✅ [进程管控] 所有进行中的 HTTP 请求已处理完毕，网关已停止接收新流量",
    );

    try {
      logger.info(
        "👋 [进程管控] 全站资源已完美释放，进程体面退出。TS-Backend Offline.",
      );
      process.exit(0);
    } catch (error) {
      logger.error("❌ [进程管控] 断开基础设施连接时发生异状:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error(
      "⚠️ [安全警报] 优雅关闭超时 (10s)，可能存在挂起请求，正在强制闪退进程...",
    );
    process.exit(1);
  }, 10000);
}

// 启动服务器
startServer();

// 监听系统信号
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
