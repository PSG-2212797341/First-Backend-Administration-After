// 内存验证码管理器
interface CodePayload {
  code: string;
  expiresAt: number;
}

// 内存版 Key-Value 存储，模拟 Redis
const storage = new Map<string, CodePayload>();

export const CodeStorage = {
  // 存入验证码，设置 5 分钟过期
  set: (username: string, code: string) => {
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟后
    storage.set(username, { code, expiresAt });
  },

  // 取出并校验
  verify: (username: string, inputCode: string): boolean => {
    const record = storage.get(username);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      storage.delete(username); // 过期删除
      return false;
    }
    const isValid = record.code === inputCode;
    if (isValid) storage.delete(username); // 验证码是一次性的，用完立刻销毁
    return isValid;
  },
};
