import mongoose, { Schema, Document } from "mongoose";

export interface ITotal extends Document {
  name: string;
  total: number;
  dailyAve: number;
  dayOnDay: number;
  weakOnWeak: number;
}

const TotalSchema: Schema<ITotal> = new Schema<ITotal>({
  name: {
    type: String,
    required: [true, '汇总名字是必须的'],
    trim: true,
    maxlength: [100, '名称不能超过100个字符']
  },
  total: {
    type: Number,
    required: true,
    min: [0, '数量不能小于0'],
    default: 0
  },
  dailyAve: {
    type: Number,
    required: true,
    default: 0
  },
  dayOnDay: {
    type: Number,
    required: true,
    default: 0
  },
  weakOnWeak: {
    type: Number,
    required: true,
    default: 0
  },
})

export const Total = mongoose.model<ITotal>('Total', TotalSchema)