import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User, Profile } from '../models';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const apiKeysSchema = z.object({
  openai: z.string().optional(),
  gemini: z.string().optional(),
  anthropic: z.string().optional(),
  custom: z.record(z.string()).optional(),
});

const preferencesSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  autoApproveSafeTools: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
});

// 1. POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'user',
    });

    // Automatically create empty user profile
    await Profile.create({
      userId: user._id,
      activeTrack: 'career',
      completenessScore: 0,
    });

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account successfully registered',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register account', message: error.message });
  }
});

// 2. POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// 3. GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      preferences: user.preferences,
      hasCustomApiKeys: {
        openai: Boolean(user.apiKeys?.openai),
        gemini: Boolean(user.apiKeys?.gemini),
        anthropic: Boolean(user.apiKeys?.anthropic),
      },
      createdAt: user.createdAt,
    },
  });
});

// 4. PUT /api/auth/api-keys
router.put('/api-keys', authenticate, validate(apiKeysSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const keys = req.body;

    user.apiKeys = {
      ...user.apiKeys,
      ...keys,
    };

    await user.save();

    res.json({
      message: 'API keys updated successfully',
      configured: {
        openai: Boolean(user.apiKeys?.openai),
        gemini: Boolean(user.apiKeys?.gemini),
        anthropic: Boolean(user.apiKeys?.anthropic),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update API keys', message: error.message });
  }
});

// 5. PUT /api/auth/preferences
router.put('/preferences', authenticate, validate(preferencesSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    user.preferences = {
      ...user.preferences,
      ...req.body,
    };

    await user.save();

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update preferences', message: error.message });
  }
});

export default router;
