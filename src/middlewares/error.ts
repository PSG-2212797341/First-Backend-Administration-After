import { Request, Response } from 'express';

// 错误处理
export const errorProduct = (error: Error, _req: Request, res: Response) => {
  console.error('未处理的错误:', error);
  res.status(500).json({
    success: false,
    message: '内部服务器错误',
    error: process.env.nodeEnv === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
}

export const errorRequest = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '路由未找到',
    timestamp: new Date().toISOString()
  });
}