import { Schema, model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'guest'], default: 'user' },
    avatarUrl: { type: String },
    apiKeys: {
      openai: { type: String },
      gemini: { type: String },
      anthropic: { type: String },
      custom: { type: Map, of: String },
    },
    preferences: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      autoApproveSafeTools: { type: Boolean, default: false },
      emailNotifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
