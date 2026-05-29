import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

// 1. 在定义文档接口中加上 email 字段
export interface IUser extends Document {
  username: string;
  password: string;
  email: string; // ⬅️ 新增：用户的电子邮箱
  role: "user" | "admin";
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;

  // 实例方法
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "用户名是必须的"],
      unique: true,
      trim: true,
      minlength: [3, "用户名至少需要3个字符"],
      maxlength: [50, "用户名不能超过50个字符"],
      match: [/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"],
    },
    // 2. 在 Schema 中新增 email 字段配置
    email: {
      type: String,
      required: [true, "电子邮箱是必须的"],
      unique: true, // ⬅️ 大厂规范：全站邮箱必须唯一，防止多账号绑定同一个邮箱
      trim: true,
      lowercase: true, // ⬅️ 自动转为小写存储（防止用户输入 Test@QQ.com 和 test@qq.com 变成两个邮箱）
      match: [
        /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
        "邮箱格式不正确",
      ],
    },
    password: {
      type: String,
      required: [true, "密码是必须的"],
      minlength: [8, "密码至少需要8个字符"],
      validate: {
        validator: function (v: string) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);
        },
        message: "密码必须包含至少一个大写字母、一个小写字母和一个数字",
      },
      select: false,
    },
    passwordHash: {
      type: String,
      required: false,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

// 密码加密中间件
UserSchema.pre("save", async function (this) {
  const user = this;

  if (!user.username || user.username.trim() === "") {
    throw new Error("用户名不能为空");
  }

  if (!user.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(user.password, salt);
    user.password = "";
  } catch (error: unknown) {
    throw error;
  }
});

// 实例方法：比较密码
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  const user = this as unknown as IUser;
  try {
    return await bcrypt.compare(candidatePassword, user.passwordHash);
  } catch (error) {
    return false;
  }
};

export const User = mongoose.model<IUser>("User", UserSchema);
