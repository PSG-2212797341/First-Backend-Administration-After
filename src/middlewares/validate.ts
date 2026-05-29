import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validate = (schema: ZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // 核心：让 Zod 自动校验并在内部转换数据（比如自动 trim）
      const parsed = await schema.parseAsync({
        body: req.body,
      });

      // 校验成功后，把清洗干净的数据重新挂载回 Express 的 req 对象上
      req.body = parsed.body;

      next(); // 放行，进入 Controller
    } catch (error) {
      // 如果是 Zod 捕获到的验证错误
      if (error instanceof ZodError) {
        // 提取出优雅、易读的错误信息数组
        const errorMessages = error.issues.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        );

        res.status(400).json({
          success: false,
          message: "输入数据格式不正确",
          errors: errorMessages,
        });
        return;
      }

      next(error); // 其他未知错误抛给全局错误中间件
    }
  };
};
