import { Request, Response, NextFunction } from 'express';
import { HydratedDocument } from 'mongoose';
import { verifyToken } from '../utils/auth';
import { User } from '../models/User';
import { IUser } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: HydratedDocument<IUser>;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired token.', message: error.message });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
      return;
    }

    next();
  };
}
