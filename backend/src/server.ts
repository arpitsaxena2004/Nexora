import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import * as models from './models';

// Import API Routers
import authRouter from './routes/auth.routes';
import profileRouter from './routes/profile.routes';
import goalRouter from './routes/goal.routes';
import workflowRouter from './routes/workflow.routes';
import agentRouter from './routes/agent.routes';
import knowledgeRouter from './routes/knowledge.routes';
import careerRouter from './routes/career.routes';
import startupRouter from './routes/startup.routes';
import approvalRouter from './routes/approval.routes';
import toolRouter from './routes/tool.routes';
import analyticsRouter from './routes/analytics.routes';
import notificationRouter from './routes/notification.routes';
import assistantRouter from './routes/assistant.routes';
import { AgentRegistry } from './agents/registry';
import { ToolRegistry } from './tools/toolRegistry';

const app = express();

// Initialize Agent & Tool Registries
AgentRegistry.initialize();
ToolRegistry.initialize();

// Global Middlewares
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger & DB Connection Assurance (Development)
app.use(async (req: Request, _res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  if (env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/goals', goalRouter);
app.use('/api/agents', agentRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/career', careerRouter);
app.use('/api/startup', startupRouter);
app.use('/api/approvals', approvalRouter);
app.use('/api/tools', toolRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api', workflowRouter);

// Health & System Info Route
app.get('/api/health', (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'ok',
    service: 'Nexora AI API',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusMap[mongoose.connection.readyState] || 'unknown',
      connected: isDbConnected,
      name: mongoose.connection.name || 'none',
    },
    registeredModels: Object.keys(models).filter((k) => typeof (models as any)[k] === 'function'),
  });
});

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Nexora AI Backend Engine is Running 🚀 (From Ambition to Autonomous Execution)',
    docs: '/api/health',
  });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint Not Found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Bootstrap Server
async function startServer() {
  await connectDB();
  await AgentRegistry.seedAgentDefinitions();

  const server = app.listen(env.PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 Nexora AI Server running on port ${env.PORT}`);
    console.log(`🔗 Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`⚙️  Environment:  ${env.NODE_ENV}`);
    console.log(`==============================================\n`);
  });

  // Graceful Shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('Server process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});

export default app;
