import { Router } from 'express';
import { TotalController } from '../controllers/TotalController';

const router = Router();
const totalController = new TotalController();

/**
 * @swagger
 * tags:
 *   name: Totals
 *   description: 汇总数据管理
 */

/**
 * @swagger
 * /api/totals:
 *   get:
 *     summary: 获取所有汇总数据
 *     tags: [Totals]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 按名称搜索
 *     responses:
 *       200:
 *         description: 成功获取汇总数据列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Total'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       500:
 *         description: 服务器错误
 */
router.get('/', totalController.getAllTotals);

/**
 * @swagger
 * /api/totals/stats/summary:
 *   get:
 *     summary: 获取汇总统计数据
 *     tags: [Totals]
 *     responses:
 *       200:
 *         description: 成功获取统计数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCount:
 *                       type: integer
 *                     avgTotal:
 *                       type: number
 *                     avgDailyAve:
 *                       type: number
 *                     maxTotal:
 *                       type: number
 *                     minTotal:
 *                       type: number
 *                     sumTotal:
 *                       type: number
 *       500:
 *         description: 服务器错误
 */
router.get('/stats/summary', totalController.getSummaryStats);

/**
 * @swagger
 * /api/totals/{id}:
 *   get:
 *     summary: 根据ID获取单个汇总数据
 *     tags: [Totals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 汇总数据ID
 *     responses:
 *       200:
 *         description: 成功获取汇总数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Total'
 *       404:
 *         description: 未找到数据
 *       400:
 *         description: 无效的ID格式
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', totalController.getTotalById);

/**
 * @swagger
 * /api/totals:
 *   post:
 *     summary: 创建新的汇总数据
 *     tags: [Totals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - describeName
 *             properties:
 *               name:
 *                 type: string
 *                 description: 汇总名称
 *               total:
 *                 type: number
 *                 description: 总计数量
 *                 default: 0
 *               describeName:
 *                 type: string
 *                 description: 分类描述名称
 *               dailyAve:
 *                 type: number
 *                 description: 日均值
 *                 default: 0
 *               dayOnDay:
 *                 type: number
 *                 description: 日环比
 *                 default: 0
 *               weakOnWeak:
 *                 type: number
 *                 description: 周环比
 *                 default: 0
 *     responses:
 *       201:
 *         description: 成功创建汇总数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Total'
 *       400:
 *         description: 请求参数错误
 *       409:
 *         description: 数据已存在
 *       500:
 *         description: 服务器错误
 */
router.post('/', totalController.createTotal);

/**
 * @swagger
 * /api/totals/batch:
 *   post:
 *     summary: 批量创建或更新汇总数据
 *     tags: [Totals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totals
 *             properties:
 *               totals:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TotalInput'
 *     responses:
 *       200:
 *         description: 批量操作完成
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     matchedCount:
 *                       type: integer
 *                     modifiedCount:
 *                       type: integer
 *                     upsertedCount:
 *                       type: integer
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/batch', totalController.batchUpsertTotals);

/**
 * @swagger
 * /api/totals/{id}:
 *   put:
 *     summary: 更新汇总数据
 *     tags: [Totals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 汇总数据ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TotalInput'
 *     responses:
 *       200:
 *         description: 成功更新汇总数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Total'
 *       404:
 *         description: 未找到数据
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', totalController.updateTotal);

/**
 * @swagger
 * /api/totals/{id}:
 *   delete:
 *     summary: 删除汇总数据
 *     tags: [Totals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 汇总数据ID
 *     responses:
 *       200:
 *         description: 成功删除汇总数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Total'
 *       404:
 *         description: 未找到数据
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', totalController.deleteTotal);

/**
 * @swagger
 * components:
 *   schemas:
 *     Total:
 *       type: object
 *       required:
 *         - name
 *         - total
 *         - describeName
 *         - dailyAve
 *         - dayOnDay
 *         - weakOnWeak
 *       properties:
 *         _id:
 *           type: string
 *           description: 数据ID
 *         name:
 *           type: string
 *           description: 汇总名称
 *         total:
 *           type: number
 *           description: 总计数量
 *         describeName:
 *           type: string
 *           description: 分类描述名称
 *         dailyAve:
 *           type: number
 *           description: 日均值
 *         dayOnDay:
 *           type: number
 *           description: 日环比
 *         weakOnWeak:
 *           type: number
 *           description: 周环比
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         name: "月度销售汇总"
 *         total: 15000
 *         describeName: "销售数据"
 *         dailyAve: 500
 *         dayOnDay: 1.05
 *         weakOnWeak: 1.15
 *         createdAt: "2024-01-01T00:00:00.000Z"
 *         updatedAt: "2024-01-02T00:00:00.000Z"
 *     TotalInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 汇总名称
 *         total:
 *           type: number
 *           description: 总计数量
 *         describeName:
 *           type: string
 *           description: 分类描述名称
 *         dailyAve:
 *           type: number
 *           description: 日均值
 *         dayOnDay:
 *           type: number
 *           description: 日环比
 *         weakOnWeak:
 *           type: number
 *           description: 周环比
 */

export default router;
