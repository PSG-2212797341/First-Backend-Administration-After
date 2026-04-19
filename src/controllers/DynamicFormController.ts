import { Request, Response } from "express";
import { DynamicForm } from "../models/DynamicForm";

// 安全的JSON解析函数
const safeJsonParse = (str: string) => {
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch (error) {
    console.warn("JSON解析失败:", str);
    return {};
  }
};

export class DynamicFormController {
  /**
   * 获取所有动态表单
   * GET /api/dynamic-forms
   */
  getAllForms = async (req: Request, res: Response): Promise<void> => {
    try {
      // 支持分页和查询参数
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // 支持名称搜索
      const nameFilter = req.query.name
        ? { name: { $regex: req.query.name as string, $options: "i" } }
        : {};

      // 执行查询
      const [forms, totalCount] = await Promise.all([
        DynamicForm.find(nameFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        DynamicForm.countDocuments(nameFilter),
      ]);

      // 解析JSON字符串
      const parsedForms = forms.map((form) => ({
        ...form,
        formConfig: safeJsonParse(form.formConfig),
        formData: safeJsonParse(form.formData),
      }));

      res.json({
        success: true,
        data: parsedForms,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("获取动态表单失败:", error);
      res.status(500).json({
        success: false,
        message: "获取动态表单失败",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      });
    }
  };

  /**
   * 创建新的动态表单
   * POST /api/dynamic-forms
   */
  createForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const { formConfig, formData, name } = req.body;

      // 验证必需字段
      if (!formConfig) {
        res.status(400).json({
          success: false,
          message: "表单配置是必需的",
        });
        return;
      }

      // 将JSON对象转换为字符串存储
      const formConfigStr =
        typeof formConfig === "string"
          ? formConfig
          : JSON.stringify(formConfig);

      const formDataStr = formData
        ? typeof formData === "string"
          ? formData
          : JSON.stringify(formData)
        : "{}";

      // 创建新的动态表单
      const newForm = new DynamicForm({
        formConfig: formConfigStr,
        formData: formDataStr,
        name: name || "表单详情",
      });

      // 保存到数据库
      await newForm.save();

      res.status(201).json({
        success: true,
        message: "动态表单创建成功",
        data: null,
      });
    } catch (error) {
      console.error("创建动态表单失败:", error);

      // 处理Mongoose验证错误
      if ((error as Error).name === "ValidationError") {
        const validationError = error as any;
        const errors = Object.values(validationError.errors).map(
          (err: any) => err.message,
        );

        res.status(400).json({
          success: false,
          message: "数据验证失败",
          errors,
        });
        return;
      }

      // 处理JSON解析错误
      if (error instanceof SyntaxError) {
        res.status(400).json({
          success: false,
          message: "JSON格式无效",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "创建动态表单失败",
      });
    }
  };

  /**
   * 更新动态表单
   * PUT /api/dynamic-forms/:id
   */
  updateForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 检查数据是否存在
      const existingForm = await DynamicForm.findById(id);
      if (!existingForm) {
        res.status(404).json({
          success: false,
          message: `未找到ID为 ${id} 的动态表单`,
        });
        return;
      }

      // 处理JSON数据转换
      const updateDataWithStrings: any = { ...updateData };

      if (updateData.formConfig) {
        updateDataWithStrings.formConfig =
          typeof updateData.formConfig === "string"
            ? updateData.formConfig
            : JSON.stringify(updateData.formConfig);
      }

      if (updateData.formData) {
        updateDataWithStrings.formData =
          typeof updateData.formData === "string"
            ? updateData.formData
            : JSON.stringify(updateData.formData);
      }

      // 更新数据
      const updatedForm = await DynamicForm.findByIdAndUpdate(
        id,
        {
          ...updateDataWithStrings,
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updatedForm) {
        res.status(404).json({
          success: false,
          message: `更新失败，未找到ID为 ${id} 的动态表单`,
        });
        return;
      }

      // 解析返回的数据
      const parsedForm = {
        ...updatedForm.toObject(),
        formConfig: safeJsonParse(updatedForm.formConfig),
        formData: safeJsonParse(updatedForm.formData),
      };

      res.json({
        success: true,
        message: "动态表单更新成功",
        data: parsedForm,
      });
    } catch (error) {
      console.error("更新动态表单失败:", error);

      if ((error as Error).name === "ValidationError") {
        const validationError = error as any;
        const errors = Object.values(validationError.errors).map(
          (err: any) => err.message,
        );

        res.status(400).json({
          success: false,
          message: "数据验证失败",
          errors,
        });
        return;
      }

      // 处理JSON解析错误
      if (error instanceof SyntaxError) {
        res.status(400).json({
          success: false,
          message: "JSON格式无效",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "更新动态表单失败",
      });
    }
  };

  /**
   * 删除动态表单
   * DELETE /api/dynamic-forms/:id
   */
  deleteForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const deletedForm = await DynamicForm.findByIdAndDelete(id);

      if (!deletedForm) {
        res.status(404).json({
          success: false,
          message: `未找到ID为 ${id} 的动态表单`,
        });
        return;
      }

      // 解析返回的数据
      const parsedForm = {
        ...deletedForm.toObject(),
        formConfig: safeJsonParse(deletedForm.formConfig),
        formData: safeJsonParse(deletedForm.formData),
      };

      res.json({
        success: true,
        message: "动态表单删除成功",
        data: parsedForm,
      });
    } catch (error) {
      console.error("删除动态表单失败:", error);
      res.status(500).json({
        success: false,
        message: "删除动态表单失败",
      });
    }
  };
}
