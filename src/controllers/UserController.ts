import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { User } from "../models/User";
import { envConfig } from "../config/envConfig";
import { CodeStorage } from "../utils/codeStorage";
import { logger } from "../config/logger"; // 🚀 1. 引入工业级日志大喇叭

export class UserController {
  /**
   * 用户注册
   */
  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password, email } = req.body;

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        res.status(409).json({ success: false, message: "用户名已存在" });
        return;
      }

      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        res
          .status(409)
          .json({ success: false, message: "该邮箱已被其他账号绑定" });
        return;
      }

      const newUser = new User({ username, password, email });
      const savedUser = await newUser.save();

      // 🚀 大厂审计：记录新用户注册落库成功
      logger.info(
        `👤 [业务审计] 新用户注册成功: ${username} | 绑定邮箱: ${email}`,
      );

      res.status(201).json({
        success: true,
        message: "用户注册成功",
        data: {
          user: {
            id: savedUser._id.toString(),
            username: savedUser.username,
            email: savedUser.email,
            createdAt: savedUser.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 用户登录
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password } = req.body;

      const user = await User.findOne({ username }).select("+passwordHash");

      if (!user || !(await user.comparePassword(password))) {
        // 🚀 安全调试：本地开发时可以用 debug 快速确认是哪个账号密码对不上
        logger.debug(
          `🔍 [安全调试] 账号登录失败尝试: 用户名 [${username}] 账密校验未通过`,
        );

        res.status(401).json({ success: false, message: "用户名或密码错误" });
        return;
      }

      const token = jwt.sign(
        { userId: user._id, username: user.username },
        envConfig.jwtSecret,
        { expiresIn: envConfig.jwtExpiresIn as jwt.SignOptions["expiresIn"] },
      );

      // 🚀 大厂审计：敏感的登录凭证发放成功，记录审计日志
      logger.info(
        `🔑 [业务审计] 用户 [${username}] 通过账密核验，登录成功，JWT 令牌已正常下发`,
      );

      res.json({
        success: true,
        message: "登录成功",
        data: {
          user: {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 发送邮箱验证码
   */
  sendCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username } = req.body;

      const user = await User.findOne({ username });

      // 🔐 大厂风控：防用户枚举攻击
      if (!user) {
        // 🚀 安全警告：枪毙 console.log，改用 logger.warn，把潜在的黑客探测行为以警告级别记录下来
        logger.warn(
          `⚠️ [风控防刷] 外部试图为不存在的用户 [${username}] 请求发信验证码，系统已启动模糊防御响应`,
        );

        res.json({
          success: true,
          message: "验证码已发送，请检查您的注册邮箱",
        });
        return;
      }

      const userEmail = user.email;
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      CodeStorage.set(username, code);

      const transporter = nodemailer.createTransport({
        host: envConfig.smtpHost,
        port: Number(envConfig.smtpPort),
        secure: true,
        auth: {
          user: envConfig.smtpUser,
          pass: envConfig.smtpPass,
        },
      } as SMTPTransport.Options);

      await transporter.sendMail({
        from: `"系统管理中心" <${envConfig.smtpUser}>`,
        to: userEmail,
        subject: "【看板管理系统】重置密码验证码",
        html: `<p>您好 <strong>${username}</strong>，您正在尝试重置密码。</p>
               <p>您的验证码是：<strong style="color: #1890ff; font-size: 20px; letter-spacing: 2px;">${code}</strong></p>
               <p>验证码 5 分钟内有效。如果非本人操作，请忽略此邮件。</p>`,
      });

      // 🚀 业务审计：验证码发送记录
      logger.info(
        `✉️ [发信审计] 成功为用户 [${username}] 投递重置密码验证码至目标邮箱 [${userEmail}]`,
      );

      res.json({
        success: true,
        message: "验证码已成功发送至您的注册邮箱",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 忘记密码（凭验证码改密）
   */
  forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password, code } = req.body;

      const isCodeValid = CodeStorage.verify(username, code);
      if (!isCodeValid) {
        logger.debug(
          `🔍 [安全调试] 用户 [${username}] 试图通过错误的验证码 [${code}] 修改密码`,
        );
        res.status(400).json({ success: false, message: "验证码错误或已过期" });
        return;
      }

      const user = await User.findOne({ username });
      if (!user) {
        res
          .status(404)
          .json({ success: false, message: "修改失败，用户不存在" });
        return;
      }

      user.password = password;
      await user.save();

      // 🚀 大厂审计：密码属于极度敏感资产，变更成功必须记录全站审计日志
      logger.info(
        `🔒 [核心安全审计] 用户 [${username}] 成功通过邮箱验证码校验，完成了密码重置重置落库`,
      );

      res.json({ success: true, message: "密码重置成功，请使用新密码登录" });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 验证验证码
   */
  validateCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, code } = req.body;

      const isCodeValid = CodeStorage.peekVerify(username, code);
      if (!isCodeValid) {
        logger.debug(
          `🔍 [安全调试] 用户 [${username}] 试图通过错误的验证码 [${code}] 修改密码`,
        );
        res.status(400).json({ success: false, message: "验证码错误或已过期" });
        return;
      } else {
        logger.debug(
          `🔍 [信息验证] 用户 [${username}] 当前的验证码 [${code}] 验证成功`,
        );
        res.status(200).json({ success: true, message: "验证码正确" });
        return;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * 验证令牌
   */
  validateToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        res.status(401).json({ success: false, message: "未提供令牌" });
        return;
      }

      const decoded = jwt.verify(token, envConfig.jwtSecret) as any;

      const user = await User.findById(decoded.userId);
      if (!user) {
        res
          .status(401)
          .json({ success: false, message: "用户不存在或已被禁用" });
        return;
      }

      res.json({
        success: true,
        message: "令牌有效",
        data: {
          user: {
            id: user._id.toString(),
            username: user.username,
            role: user.role,
          },
        },
      });
    } catch (error) {
      if (
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.TokenExpiredError
      ) {
        // 🚀 性能优化：对于非恶意的 JWT 自然过期，使用 debug 打印，不撑爆 info 正常的转运文件
        logger.debug(
          `🔍 [常规令牌退场] 前端携带的令牌已自然失效或损毁: ${error.message}`,
        );

        res.status(401).json({
          success: false,
          message:
            error instanceof jwt.TokenExpiredError
              ? "令牌已过期，请重新登录"
              : "无效的令牌凭证",
        });
        return;
      }

      next(error);
    }
  };
}
