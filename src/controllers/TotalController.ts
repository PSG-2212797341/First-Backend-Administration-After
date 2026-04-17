import { Request, Response } from 'express';
import { Total } from '../models/Total';

export class TotalController {
  /**
   * 获取所有汇总数据
   * GET /api/totals
   */
  getAllTotals = async (req: Request, res: Response): Promise<void> => {
    try {
      // 支持分页和查询参数
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      
      // 支持名称搜索
      const nameFilter = req.query.name 
        ? { name: { $regex: req.query.name as string, $options: 'i' } } 
        : {};
      
      // 执行查询
      const [totals, totalCount] = await Promise.all([
        Total.find(nameFilter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(), // 使用lean()获得纯JavaScript对象，提高性能
        
        Total.countDocuments(nameFilter)
      ]);
      
      res.json({
        success: true,
        data: totals,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('获取汇总数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取汇总数据失败',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  };

  /**
   * 根据ID获取单个汇总数据
   * GET /api/totals/:id
   */
  getTotalById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const total = await Total.findById(id);
      
      if (!total) {
        res.status(404).json({
          success: false,
          message: `未找到ID为 ${id} 的汇总数据`
        });
        return;
      }
      
      res.json({
        success: true,
        data: total
      });
    } catch (error) {
      console.error('获取汇总数据失败:', error);
      
      // 检查是否是无效的ObjectId格式
      if ((error as Error).name === 'CastError') {
        res.status(400).json({
          success: false,
          message: '无效的ID格式'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: '获取汇总数据失败'
      });
    }
  };

  /**
   * 创建新的汇总数据
   * POST /api/totals
   */
  createTotal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        name, 
        total, 
        describeName, 
        dailyAve, 
        dayOnDay, 
        weakOnWeak 
      } = req.body;
      
      // 验证必需字段
      if (!name || !describeName) {
        res.status(400).json({
          success: false,
          message: '名称和描述名称是必需的'
        });
        return;
      }
      
      // 创建新的汇总数据
      const newTotal = new Total({
        name,
        total: total || 0,
        describeName,
        dailyAve: dailyAve || 0,
        dayOnDay: dayOnDay || 0,
        weakOnWeak: weakOnWeak || 0
      });
      
      // 保存到数据库
      const savedTotal = await newTotal.save();
      
      res.status(201).json({
        success: true,
        message: '汇总数据创建成功',
        data: savedTotal
      });
    } catch (error) {
      console.error('创建汇总数据失败:', error);
      
      // 处理Mongoose验证错误
      if ((error as Error).name === 'ValidationError') {
        const validationError = error as any;
        const errors = Object.values(validationError.errors).map((err: any) => err.message);
        
        res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors
        });
        return;
      }
      
      // 处理重复键错误（如果name或describeName有唯一索引）
      if ((error as any).code === 11000) {
        res.status(409).json({
          success: false,
          message: '名称或描述名称已存在'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: '创建汇总数据失败'
      });
    }
  };

  /**
   * 更新汇总数据
   * PUT /api/totals/:id
   */
  updateTotal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 检查数据是否存在
      const existingTotal = await Total.findById(id);
      if (!existingTotal) {
        res.status(404).json({
          success: false,
          message: `未找到ID为 ${id} 的汇总数据`
        });
        return;
      }
      
      // 更新数据
      const updatedTotal = await Total.findByIdAndUpdate(
        id,
        { 
          ...updateData,
          updatedAt: new Date() // 手动更新更新时间
        },
        { 
          new: true, // 返回更新后的文档
          runValidators: true // 运行验证
        }
      );
      
      res.json({
        success: true,
        message: '汇总数据更新成功',
        data: updatedTotal
      });
    } catch (error) {
      console.error('更新汇总数据失败:', error);
      
      if ((error as Error).name === 'ValidationError') {
        const validationError = error as any;
        const errors = Object.values(validationError.errors).map((err: any) => err.message);
        
        res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: '更新汇总数据失败'
      });
    }
  };

  /**
   * 删除汇总数据
   * DELETE /api/totals/:id
   */
  deleteTotal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const deletedTotal = await Total.findByIdAndDelete(id);
      
      if (!deletedTotal) {
        res.status(404).json({
          success: false,
          message: `未找到ID为 ${id} 的汇总数据`
        });
        return;
      }
      
      res.json({
        success: true,
        message: '汇总数据删除成功',
        data: deletedTotal
      });
    } catch (error) {
      console.error('删除汇总数据失败:', error);
      res.status(500).json({
        success: false,
        message: '删除汇总数据失败'
      });
    }
  };

  /**
   * 批量创建或更新汇总数据
   * POST /api/totals/batch
   */
  batchUpsertTotals = async (req: Request, res: Response): Promise<void> => {
    try {
      const { totals } = req.body;
      
      if (!Array.isArray(totals) || totals.length === 0) {
        res.status(400).json({
          success: false,
          message: '需要提供汇总数据数组'
        });
        return;
      }
      
      // 限制批量操作数量
      if (totals.length > 100) {
        res.status(400).json({
          success: false,
          message: '批量操作数量不能超过100条'
        });
        return;
      }
      
      const operations = totals.map(total => ({
        updateOne: {
          filter: { name: total.name }, // 根据name查找
          update: { 
            $set: {
              ...total,
              updatedAt: new Date()
            }
          },
          upsert: true // 如果不存在则创建
        }
      }));
      
      const result = await Total.bulkWrite(operations);
      
      res.json({
        success: true,
        message: '批量操作完成',
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedCount: result.upsertedCount
        }
      });
    } catch (error) {
      console.error('批量操作失败:', error);
      res.status(500).json({
        success: false,
        message: '批量操作失败'
      });
    }
  };

  /**
   * 获取统计数据
   * GET /api/totals/stats/summary
   */
  getSummaryStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await Total.aggregate([
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            avgTotal: { $avg: '$total' },
            avgDailyAve: { $avg: '$dailyAve' },
            maxTotal: { $max: '$total' },
            minTotal: { $min: '$total' },
            sumTotal: { $sum: '$total' }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: stats[0] || {}
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取统计数据失败'
      });
    }
  };
}
