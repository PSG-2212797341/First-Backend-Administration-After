// 用于组装所有中间件配置、路由挂载和 Swagger 初始化
import express from "express";
import helmet from "helmet";
import { errorProduct, errorRequest } from "./middlewares/error";
import authRoutes from "./routes/userRoutes";
import { envConfig } from "./config/envConfig";
import { setupSwagger } from "./config/swagger";

// 验证环境变量
envConfig.validate();

const app = express();

// 中间件
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger文档
setupSwagger(app);

// 路由
app.use(`${envConfig.apiPrefix}/v1/auth`, authRoutes);

// 错误处理中间件
app.use(errorRequest);
app.use(errorProduct);
// 🎯 大厂解耦灵魂：只导出给外界（index.ts 或测试文件）用
export { app };
