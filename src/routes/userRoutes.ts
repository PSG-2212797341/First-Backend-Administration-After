// src/routes/authRoutes.ts
import { Router } from "express";
import { UserController } from "@/controllers/UserController";
import { validate } from "@/middlewares/validate";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  sendCodeSchema,
} from "@/validators/user.validator";

const router = Router();
const authController = new UserController();

// 先拦截验证，验证通过才进控制器
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/send-code", validate(sendCodeSchema), authController.sendCode);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.get("/validate-token", authController.validateToken);

export default router;
