import mongoose, { Schema, Document } from "mongoose";

export interface IDynamicForm extends Document {
  formConfig: string;
  formData: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DynamicFormSchema: Schema<IDynamicForm> = new Schema<IDynamicForm>({
  formConfig: {
    type: String,
    required: [true, "表单的配置选项是必须的"],
  },
  formData: {
    type: String,
    required: [true, "表单的值是必须的"],
  },
  name: {
    type: String,
    default: '表单详情'
  },
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

export const DynamicForm = mongoose.model<IDynamicForm>('DynamicForm', DynamicFormSchema)