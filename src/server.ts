// 数据库链接
import mongoose from "mongoose";
import { envConfig } from "./config/envConfig";
import { logger } from "./config/logger"; // 🚀 1. 引入你的 Winston 实例

export const connectDatabase = async (): Promise<void> => {
  const url = envConfig.databaseUrl;

  if (!url) {
    // 💡 这里不需要手写 logger.error，因为 throw 出去后，
    // 会被 app.ts 的 startServer 捕获到，那边会统一用 logger.error 打印致命错误
    throw new Error("没有设置链接的mongodb的url");
  }

  try {
    await mongoose.connect(url, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    // 🚀 更换：由于 app.ts 里我们已经有一行规整的系统开业快照日志了，
    // 这里我们可以用 debug 记录底层基础设施的就绪状态，或者用 info 均可。
    logger.debug("🗄️  [基础设施] Mongoose 成功与 MongoDB 建立初始连接池");

    // ==========================================
    // 🛡️ 大厂规范：对运行中的数据库生命周期进行全天候监控（埋点）
    // ==========================================

    // 🚀 更换：运行中突发报错，必须记为最高优先级的 error，并把错误对象丢进去抓取堆栈
    mongoose.connection.on("error", (error) => {
      logger.error(
        "💥 [基础设施重大故障] Mongoose 运行中突发数据库连接错误:",
        error,
      );
    });

    // 🚀 更换：运行中突发断连（通常是网络抖动或机房断电），属于严重警告，需要运维立刻关注
    mongoose.connection.on("disconnected", () => {
      logger.warn(
        "⚠️ [基础设施警告] Mongoose 检测到与 MongoDB 的连接已断开，系统正在尝试自动重连...",
      );
    });
  } catch (error) {
    // 🚀 更换：首次连接数据库就失败，属于无法开业的致命错误
    logger.error(
      "💥 [基础设施崩溃] 首次连接 MongoDB 数据库时发生不可逆异状:",
      error,
    );
    // 结束进程
    process.exit(1);
  }
};
