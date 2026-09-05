import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { IUser } from '../types';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(user: IUser): string {
  const payload: ITokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}

export function verifyToken(token: string): ITokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
}
