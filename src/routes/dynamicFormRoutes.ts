import { Router } from 'express';
import { DynamicFormController } from '../controllers/DynamicFormController';

const router = Router();
const dynamicFormController = new DynamicFormController();

/**
 * @swagger
 * tags:
 *   name: DynamicForms
 *   description: 动态表单管理
 */

/**
 * @swagger
 * /api/dynamic-forms:
 *   get:
 *     summary: 获取所有动态表单
 *     tags: [DynamicForms]
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
 *         description: 成功获取动态表单列表
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
 *                     $ref: '#/components/schemas/DynamicForm'
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
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: 服务器错误
 */
router.get('/', dynamicFormController.getAllForms);

/**
 * @swagger
 * /api/dynamic-forms:
 *   post:
 *     summary: 创建新的动态表单
 *     tags: [DynamicForms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formConfig
 *             properties:
 *               formConfig:
 *                 oneOf:
 *                   - type: string
 *                     description: JSON格式的字符串
 *                   - type: object
 *                     description: 表单配置对象
 *                 description: 表单配置（字段定义、验证规则等）
 *               formData:
 *                 oneOf:
 *                   - type: string
 *                     description: JSON格式的字符串
 *                   - type: object
 *                     description: 表单数据对象
 *                 description: 表单数据
 *               name:
 *                 type: string
 *                 description: 表单名称
 *                 default: '表单详情'
 *     responses:
 *       201:
 *         description: 成功创建动态表单
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
 *                   $ref: '#/components/schemas/DynamicForm'
 *       400:
 *         description: 请求参数错误或JSON格式无效
 *       500:
 *         description: 服务器错误
 */
router.post('/', dynamicFormController.createForm);

/**
 * @swagger
 * /api/dynamic-forms/{id}:
 *   put:
 *     summary: 更新动态表单
 *     tags: [DynamicForms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 动态表单ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DynamicFormInput'
 *     responses:
 *       200:
 *         description: 成功更新动态表单
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
 *                   $ref: '#/components/schemas/DynamicForm'
 *       404:
 *         description: 未找到表单
 *       400:
 *         description: 请求参数错误或JSON格式无效
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', dynamicFormController.updateForm);

/**
 * @swagger
 * /api/dynamic-forms/{id}:
 *   delete:
 *     summary: 删除动态表单
 *     tags: [DynamicForms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 动态表单ID
 *     responses:
 *       200:
 *         description: 成功删除动态表单
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
 *                   $ref: '#/components/schemas/DynamicForm'
 *       404:
 *         description: 未找到表单
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', dynamicFormController.deleteForm);

/**
 * @swagger
 * components:
 *   schemas:
 *     DynamicForm:
 *       type: object
 *       required:
 *         - formConfig
 *         - formData
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: 表单ID
 *         formConfig:
 *           type: object
 *           description: 表单配置（解析后的JSON对象）
 *           additionalProperties: true
 *         formData:
 *           type: object
 *           description: 表单数据（解析后的JSON对象）
 *           additionalProperties: true
 *         name:
 *           type: string
 *           description: 表单名称
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
 *         formConfig:
 *           fields:
 *             - name: "username"
 *               label: "用户名"
 *               type: "input"
 *               required: true
 *             - name: "email"
 *               label: "邮箱"
 *               type: "input"
 *               required: true
 *         formData:
 *           username: "john_doe"
 *           email: "john@example.com"
 *         name: "用户注册表单"
 *         createdAt: "2024-01-01T00:00:00.000Z"
 *         updatedAt: "2024-01-02T00:00:00.000Z"
 *     DynamicFormInput:
 *       type: object
 *       properties:
 *         formConfig:
 *           oneOf:
 *             - type: string
 *               description: JSON格式的字符串
 *             - type: object
 *               description: 表单配置对象
 *           description: 表单配置（字段定义、验证规则等）
 *         formData:
 *           oneOf:
 *             - type: string
 *               description: JSON格式的字符串
 *             - type: object
 *               description: 表单数据对象
 *           description: 表单数据
 *         name:
 *           type: string
 *           description: 表单名称
 *           default: '表单详情'
 *       example:
 *         formConfig:
 *           fields:
 *             - name: "username"
 *               label: "用户名"
 *               type: "input"
 *               required: true
 *         formData:
 *           username: "test_user"
 *         name: "测试表单"
 */

export default router;
