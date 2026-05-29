module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // 🎯 核心修复：教 Jest 认识什么是 "@/"
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // 如果你之前有其他配置，保持原样即可
  runInBand: true,
  detectOpenHandles: true,
};