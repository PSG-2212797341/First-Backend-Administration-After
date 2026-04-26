import mongoose, { Document, Schema } from "mongoose"
import bcrypt from "bcrypt"

// 定义文档接口
export interface ILogin extends Document {
    username: string
    password: string
    role: "user" | "admin"
    passwordHash: string
    createdAt: Date
    updatedAt: Date
    
    // 实例方法
    comparePassword(candidatePassword: string): Promise<boolean>
}

const LoginSchema = new Schema<ILogin>(
    {
        username: {
            type: String,
            required: [true, '用户名是必须的'],
            unique: true,
            trim: true,
            minlength: [3, '用户名至少需要3个字符'],
            maxlength: [50, '用户名不能超过50个字符'],
            match: [/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线']
        },
        password: {
            type: String,
            required: [true, '密码是必须的'],
            minlength: [8, '密码至少需要8个字符'],
            validate: {
                validator: function(v: string) {
                    // 密码强度验证：至少包含一个大写字母、一个小写字母、一个数字
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v)
                },
                message: '密码必须包含至少一个大写字母、一个小写字母和一个数字'
            },
            select: false // 查询时不返回密码字段
        },
        passwordHash: {
            type: String,
            required: false,
            select: false // 查询时不返回密码哈希字段
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        }
    },
    {
        timestamps: true // 自动添加 createdAt 和 updatedAt 字段
    }
)

// 密码加密中间件
LoginSchema.pre('save', async function(this) {
    const user = this;
    
    // 确保username不为null或undefined
    if (!user.username || user.username.trim() === '') {
        throw new Error('用户名不能为空');
    }
    
    // 只有密码被修改时才重新加密
    if (!user.isModified('password')) return;
    
    try {
        // 生成盐并加密密码
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(user.password, salt);
        
        // 清除明文密码（可选，但建议）
        user.password = '';
    } catch (error: unknown) {
        throw error;
    }
});


// 实例方法：比较密码
LoginSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    const user = this as unknown as ILogin
    try {
        return await bcrypt.compare(candidatePassword, user.passwordHash)
    } catch (error) {
        return false
    }
}

export const Login = mongoose.model<ILogin>("Login", LoginSchema)
