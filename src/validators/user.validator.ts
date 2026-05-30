import { z } from "zod";

// 1. 公用的原子规则
const usernameRule = z
  .string({ error: "用户名是必需的" })
  .trim()
  .min(1, "用户名不能为空");
const passwordRule = z
  .string({ error: "密码是必需的" })
  .min(8, "密码长度至少 8 位")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
    "密码必须包含至少一个大写字母、一个小写字母和一个数字",
  );
const emailRule = z.string({ error: "邮箱是必需的" }).email("邮箱格式不正确");
const codeRule = z
  .string({ error: "验证码是必需的" })
  .length(6, "验证码必须是 6 位数字");

// 2. 导出给 Express 中间件用的校验器
export const registerSchema = z.object({
  body: z.object({
    username: usernameRule,
    password: passwordRule,
    email: emailRule,
  }),
});
export const loginSchema = z.object({
  body: z.object({
    username: usernameRule,
    password: z.string({ error: "密码是必需的" }),
  }),
});
export const sendCodeSchema = z.object({
  body: z.object({ username: usernameRule }),
});
export const verifyCodeSchema = z.object({
  // 或者是 Joi.object / 根据你实际的库来
  body: z.object({
    username: z.string().min(3, "用户名格式不正确"),
    code: z.string().length(6, "验证码必须为6位"), // 🌟 显式允许并校验 code 字段！
  }),
});
export const forgotPasswordSchema = z.object({
  body: z.object({
    username: usernameRule,
    password: passwordRule,
    code: codeRule,
  }),
});
