import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("没有设置链接的mongodb的url");
  }

  try {
    await mongoose.connect(url, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("数据库连接成功");

    mongoose.connection.on("error", (error) => {
      console.log("数据库连接错误", error);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('数据库断开链接')
    })
  } catch (error) {
    console.log('数据库连接失败', error)
    // 结束进程
    process.exit(1)
  }
};
