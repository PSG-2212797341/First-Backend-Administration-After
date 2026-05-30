import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registry } from "@/config/swagger";

extendZodWithOpenApi(z);

// ==========================================
// 🏢 大厂标准：统一的可复用响应组件 (Components)
// ==========================================

// 1. 全局统一的错误响应结构 (400, 401, 409, 500 等通用)
const CommonErrorSchema = z
  .object({
    success: z.boolean().openapi({
      example: false,
      description: "请求是否成功标志，固定为 false",
    }),
    message: z.string().openapi({
      example: "用户名已存在 / 验证码错误",
      description: "给前端展示的友好提示信息",
    }),
    errors: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["body.password: 密码长度至少 8 位"],
        description: "详细的参数校验错误列表（主要用于 400 拦截提示）",
      }),
    timestamp: z.string().openapi({
      example: "2026-05-29T12:00:00.000Z",
      description: "服务器发生错误时的标准时间戳",
    }),
  })
  .openapi("CommonErrorResponse");

// 2. 脱敏后的基础用户数据模型
const UserBaseSchema = z.object({
  id: z.string().openapi({
    example: "64748392a1b2c3d4e5f60001",
    description: "数据库唯一用户 ID",
  }),
  username: z
    .string()
    .openapi({ example: "alex_developer", description: "系统全局唯一用户名" }),
  email: z.string().email().openapi({
    example: "1508790594@qq.com",
    description: "用户绑定的安全电子邮箱",
  }),
  role: z
    .enum(["user", "admin"])
    .openapi({ example: "user", description: "用户权限角色" }),
});

// ==========================================
// 📥 细化后的请求体组件定义 (Request Bodies)
// ==========================================

const registerBody = z
  .object({
    username: z.string().min(3).max(50).openapi({
      example: "alex_developer",
      description: "用户名：长度3-50位",
    }),
    password: z.string().min(8).openapi({
      example: "Password123",
      description: "强密码：至少8位，包含大小写字母与数字",
    }),
    email: z.string().email().openapi({
      example: "1508790594@qq.com",
      description: "安全邮箱：全站唯一，用于密码找回",
    }),
  })
  .openapi("RegisterInput");

const loginBody = z
  .object({
    username: z
      .string()
      .openapi({ example: "alex_developer", description: "登录用户名" }),
    password: z
      .string()
      .openapi({ example: "Password123", description: "登录密码" }),
  })
  .openapi("LoginInput");

const sendCodeBody = z
  .object({
    username: z.string().openapi({
      example: "alex_developer",
      description: "需要找回密码的用户名",
    }),
  })
  .openapi("SendCodeInput");

const forgotPasswordBody = z
  .object({
    username: z
      .string()
      .openapi({ example: "alex_developer", description: "用户名" }),
    password: z.string().min(8).openapi({
      example: "NewPassword123",
      description: "准备变更的全新强密码",
    }),
    code: z.string().length(6).openapi({
      example: "582910",
      description: "邮箱收到的 6 位数一次性验证码",
    }),
  })
  .openapi("ForgotPasswordInput");

// ==========================================
// 🛣️ 统统一口气注册到 Swagger 路由表里
// ==========================================
export function registerAuthSwaggerDocs() {
  // 1. 注册接口
  registry.registerPath({
    method: "post",
    path: "/register",
    summary: "新用户注册 API",
    description: "开放接口。创建新用户账号并强制绑定全站唯一的安全邮箱。",
    tags: ["用户认证模块"],
    request: {
      body: { content: { "application/json": { schema: registerBody } } },
    },
    responses: {
      201: {
        description: "201 Created - 注册成功",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              message: z.string().openapi({ example: "用户注册成功" }),
              data: z.object({
                user: UserBaseSchema.extend({
                  createdAt: z
                    .string()
                    .openapi({ example: "2026-05-29T12:00:00.000Z" }),
                }),
              }),
            }),
          },
        },
      },
      400: {
        description: "400 Bad Request - 参数不合规（被 Zod 拦截）",
        content: { "application/json": { schema: CommonErrorSchema } },
      },
      409: {
        description: "409 Conflict - 用户名或邮箱已被占用",
        content: { "application/json": { schema: CommonErrorSchema } },
      },
    },
  });

  // 2. 登录接口
  registry.registerPath({
    method: "post",
    path: "/login",
    summary: "用户登录认证 API",
    description:
      "开放接口。凭账密登录，成功后颁发 HS256 加密的无状态 JWT 访问令牌。",
    tags: ["用户认证模块"],
    request: {
      body: { content: { "application/json": { schema: loginBody } } },
    },
    responses: {
      200: {
        description: "200 OK - 登录成功，颁发 Token",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              message: z.string().openapi({ example: "登录成功" }),
              data: z.object({
                user: UserBaseSchema.omit({ email: true }), // 登录成功返回脱敏数据
                token: z.string().openapi({
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  description: "JWT 访问令牌，后续请求放在 Authorization 头中",
                }),
              }),
            }),
          },
        },
      },
      401: {
        description:
          "401 Unauthorized - 用户名不存在或密码错误（模糊提示防御）",
        content: { "application/json": { schema: CommonErrorSchema } },
      },
    },
  });

  // 3. 发送验证码接口
  registry.registerPath({
    method: "post",
    path: "/send-code",
    summary: "请求发送重置密码验证码",
    description:
      "开放接口。忘记密码第一步：通过用户名反查安全邮箱发送验证码。此接口已做防用户枚举模糊处理。",
    tags: ["用户认证模块"],
    request: {
      body: { content: { "application/json": { schema: sendCodeBody } } },
    },
    responses: {
      200: {
        description:
          "200 OK - 验证码指令下发成功。如果账号真实存在，验证码将在2分钟内投入该用户的注册邮箱（5分钟内有效）。",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              message: z
                .string()
                .openapi({ example: "验证码已成功发送至您的注册邮箱" }),
            }),
          },
        },
      },
    },
  });

  // 4. 忘记密码重置接口
  registry.registerPath({
    method: "post",
    path: "/forgot-password",
    summary: "凭邮箱验证码执行密码重置",
    description:
      "开放接口。忘记密码第二步：提供新密码以及 6 位验证码。验证码一经校验成功，立刻在内存中销毁，防二次重放攻击。",
    tags: ["用户认证模块"],
    request: {
      body: { content: { "application/json": { schema: forgotPasswordBody } } },
    },
    responses: {
      200: {
        description: "200 OK - 密码重置成功",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              message: z
                .string()
                .openapi({ example: "密码重置成功，请使用新密码登录" }),
            }),
          },
        },
      },
      400: {
        description: "400 Bad Request - 验证码错误、已过期、或新密码强度不够",
        content: { "application/json": { schema: CommonErrorSchema } },
      },
    },
  });

  // 5. 验证 Token 接口
  registry.registerPath({
    method: "get",
    path: "/validate-token",
    summary: "验证 JWT 访问令牌有效性",
    description:
      "🔒 鉴权接口。主要供前端页面路由守卫或网关层调用，核验当前持有的 Bearer Token 是否合法且未过期。",
    tags: ["用户认证模块"],
    security: [{ bearerAuth: [] }], // 🚀 关联右上角及接口右侧的 Authorize 安全锁
    responses: {
      200: {
        description: "200 OK - 令牌解析验签成功，返回该合法的当前登录用户信息",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              message: z.string().openapi({ example: "令牌有效" }),
              data: z.object({ user: UserBaseSchema }),
            }),
          },
        },
      },
      401: {
        description: "401 Unauthorized - 令牌伪造、签名不匹配或已过期",
        content: { "application/json": { schema: CommonErrorSchema } },
      },
    },
  });

  // 6. 验证码核验接口
  registry.registerPath({
    method: "post",
    path: "/verify-code",
    summary: "实时核验验证码有效性",
    description:
      "开放接口。用于前端表单实时校验。校验验证码是否正确且在有效期内，确保下一步重置密码流程的安全性。",
    tags: ["用户认证模块"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z
              .object({
                username: z
                  .string()
                  .openapi({
                    example: "alex_developer",
                    description: "用户名",
                  }),
                code: z
                  .string()
                  .length(6)
                  .openapi({ example: "582910", description: "6位验证码" }),
              })
              .openapi("VerifyCodeInput"),
          },
        },
      },
    },
    responses: {
      200: {
        description: "200 OK - 验证码校验通过",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean().openapi({ example: true }),
              message: z.string().openapi({ example: "验证码正确" }),
            }),
          },
        },
      },
      400: {
        description: "400 Bad Request - 验证码错误或已过期",
        content: { "application/json": { schema: CommonErrorSchema } },
      },
    },
  });
}
