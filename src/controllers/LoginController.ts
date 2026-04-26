import { Request, Response } from "express";
import { Login } from "../models/Login";
import jwt from "jsonwebtoken";

// 环境变量配置
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export class LoginController {
  /**
   * 用户注册
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      // 验证必需字段
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: "用户名和密码是必需的",
        });
        return;
      }

      // 检查用户名是否已存在
      const existingUser = await Login.findOne({ username });
      
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "用户名已存在",
        });
        return;
      } 

      // 创建新用户 - 添加额外的验证
      if (!username || username.trim() === '') {
        res.status(400).json({
          success: false,
          message: "用户名不能为空",
        });
        return;
      }
      
      const newUser = new Login({
        username: username.trim(), // 确保去除空格
        password, // 密码会在保存前通过模型中间件自动加密
      });

      // 保存用户
      const savedUser = await newUser.save();

      // 返回用户信息（不包含密码）
      const userResponse = {
        id: savedUser._id.toString(),
        username: savedUser.username,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      };

      res.status(201).json({
        success: true,
        message: "用户注册成功",
        data: {
          user: userResponse,
        },
      });
    } catch (error) {
      // 处理Mongoose验证错误
      if ((error as Error).name === "ValidationError") {
        const validationError = error as any;
        const errors = Object.values(validationError.errors).map(
          (err: any) => err.message
        );

        res.status(400).json({
          success: false,
          message: "数据验证失败",
          errors,
        });
        return;
      }

      // 处理重复键错误
      if ((error as any).code === 11000) {
        res.status(409).json({
          success: false,
          message: "用户名已存在",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "用户注册失败",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  };

  /**
   * 用户登录
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      // 验证必需字段
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: "用户名和密码是必需的",
        });
        return;
      }

      // 查找用户（包含passwordHash字段用于密码验证）
      const user = await Login.findOne({ username }).select("+passwordHash");

      if (!user) {
        res.status(401).json({
          success: false,
          message: "用户名或密码错误",
        });
        return;
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: "用户名或密码错误",
        });
        return;
      }

      // 生成JWT令牌
      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
      );

      // 返回用户信息（不包含密码）
      const userResponse = {
        id: user._id.toString(),
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role
      };

      console.log(user.role)
      res.json({
        success: true,
        message: "登录成功",
        data: {
          user: userResponse,
          token,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "登录失败",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  };

  /**
   * 忘记密码（简化版 - 基于用户名重置密码）
   * POST /api/auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      // 验证必需字段
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: "用户名和新密码是必需的",
        });
        return;
      }

      // 查找用户
      const user = await Login.findOne({ username });
      if (!user) {
        // 出于安全考虑，不透露用户是否存在
        res.json({
          success: true,
          message: "如果用户存在，密码重置请求已处理",
        });
        return;
      }

      // 验证新密码强度
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(password)) {
        res.status(400).json({
          success: false,
          message: "密码必须包含至少一个大写字母、一个小写字母和一个数字，且长度至少8位",
        });
        return;
      }

      // 更新密码（模型中间件会自动加密）
      user.password = password;
      await user.save();

      res.json({
        success: true,
        message: "密码重置成功",
      });
    } catch (error) {

      // 处理Mongoose验证错误
      if ((error as Error).name === "ValidationError") {
        const validationError = error as any;
        const errors = Object.values(validationError.errors).map(
          (err: any) => err.message
        );

        res.status(400).json({
          success: false,
          message: "数据验证失败",
          errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "密码重置失败",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  };

  /**
   * 验证令牌（可选辅助功能）
   * GET /api/auth/validate-token
   */
  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        res.status(401).json({
          success: false,
          message: "未提供令牌",
        });
        return;
      }

      // 验证令牌
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // 查找用户
      const user = await Login.findById(decoded.userId);
      if (!user) {
        res.status(401).json({
          success: false,
          message: "用户不存在",
        });
        return;
      }

      res.json({
        success: true,
        message: "令牌有效",
        data: {
          user: {
            id: user._id.toString(),
            username: user.username,
          },
        },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          message: "无效令牌",
        });
        return;
      }

      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: "令牌已过期",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "令牌验证失败",
      });
    }
  };
}
