// 接口文档相关配置
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { registerAuthSwaggerDocs } from "../swagger/user.swagger"; // ⬅️ 引入新切出去的文档

export const registry = new OpenAPIRegistry();

// 注册锁图标
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

export function generateSwaggerDocs() {
  // 🚀 核心：生成文档前，执行一下这个函数，把认证模块的接口全部注册进来
  registerAuthSwaggerDocs();

  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: { version: "1.0.0", title: "🔐 统一认证服务 API 文档" },
    servers: [{ url: "/api/v1" }],
  });
}

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, (req: any, res: any, next: any) => {
    swaggerUi.setup(generateSwaggerDocs())(req, res, next);
  });
  console.log("📝 Swagger 文档已挂载至: http://localhost:3000/api-docs");
}
