import "dotenv/config"; // 🎯 1. 确保第一行加载 .env 变量
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../app"; // 🎯 2. 确保这里的 app 没在底部私自 listen 端口
import { CodeStorage } from "../utils/codeStorage";

// 延长 Jest 的耐心到 30 秒（防止远程 Atlas 数据库连接慢或加密算法耗时）
jest.setTimeout(30000);

const testUser = {
  username: "leon_test_admin",
  password: "SecurePassword123!",
  email: "leon_test@example.com",
};

beforeAll(async () => {
  // 🎯 3. 优雅读取环境变量
  const testDbUrl = process.env.TEST_DATABASE_URL;
  if (!testDbUrl) {
    throw new Error("🚨 错误：未在 .env 中配置 TEST_DATABASE_URL！");
  }

  // 连接专属测试库
  await mongoose.connect(testDbUrl);
});

afterAll(async () => {
  // 🎯 4. 彻底双向闭环：清空测试数据，断开连接
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
});

// 下面保持你原本的 describe("🏢 用户认证模块...", () => { ... }) 不变

// ==========================================
// 🎯 正式轰炸测试用例
// ==========================================
describe("🏢 用户认证模块（Auth）全链路集成测试", () => {
  // 模拟一个干净的测试账号
  const testUser = {
    username: "jest_tester",
    password: "TestPassword123",
    email: "jest_test@qq.com",
  };

  // 1. 测试【用户注册】接口
  it("✅ POST /register - 应该能成功注册一个新用户", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser); // 轰炸

    // 断言（Assert）：预期返回 201 成功状态码
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(testUser.username);
    expect(res.body.data.user).toHaveProperty("id"); // 确保数据库生成了唯一ID
  });

  // 2. 测试【重复注册拦截】防御
  it("❌ POST /register - 再次注册同名用户，应该被 409 拦截拒绝", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("已存在");
  });

  // 3. 测试【用户登录】接口
  it("✅ POST /login - 凭刚才注册的账密登录，应该成功并颁发 JWT Token", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      username: testUser.username,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token"); // 🚀 最核心：必须吐出 JWT 令牌！
  });

  // 4. 测试【登录失败防御】
  it("❌ POST /login - 输入错误的密码，应该返回 401 鉴权失败", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      username: testUser.username,
      password: "WrongPassword！！！",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("用户名或密码错误");
  });

  // 5. 测试【防枚举发信防御】
  it("🔒 POST /send-code - 为不存在的用户发信，应该启动大厂模糊防御（返回成功但后台警告）", async () => {
    const res = await request(app)
      .post("/api/v1/auth/send-code")
      .send({ username: "fake_user_hahaha" });

    expect(res.status).toBe(200); // 假装成功
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("验证码已发送");
  });

  // 6. 测试【验证码核验接口】（你的最新功能）
  it("✅ POST /verify-code - 验证码核验成功应返回 200", async () => {
    // 🌟 使用 .set 方法注入测试数据
    CodeStorage.set(testUser.username, "123456");

    const res = await request(app)
      .post("/api/v1/auth/verify-code") // 确保这里的路径与你后端实际路由一致
      .send({ username: testUser.username, code: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("❌ POST /verify-code - 输入错误验证码应返回 400", async () => {
    const res = await request(app)
      .post("/api/v1/auth/verify-code")
      .send({ username: testUser.username, code: "999999" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("验证码");
  });
});
