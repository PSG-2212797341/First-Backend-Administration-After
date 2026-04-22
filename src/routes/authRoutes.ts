import { Router } from 'express';
import { LoginController } from '../controllers/LoginController';

const router = Router();
const loginController = new LoginController();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', loginController.register);

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', loginController.login);

/**
 * 忘记密码
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', loginController.forgotPassword);

/**
 * 验证令牌
 * GET /api/auth/validate-token
 */
router.get('/validate-token', loginController.validateToken);

export default router;
