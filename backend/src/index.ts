import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import crmRoutes from './routes/crmRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import milestoneRoutes from './routes/milestoneRoutes';
import userRoutes from './routes/userRoutes';
import documentRoutes from './routes/documentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import activityLogRoutes from './routes/activityLogRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportsRoutes from './routes/reportsRoutes';
import settingsRoutes from './routes/settingsRoutes';
import aiRoutes from './routes/aiRoutes';
import invitationRoutes from './routes/invitationRoutes';
import searchRoutes from './routes/searchRoutes';
import { errorHandler } from './middleware/errorHandler';

console.log('[DevFlow Startup] AI Provider Configuration:');
console.log(`  AI_PROVIDER: ${process.env.AI_PROVIDER || 'gemini (default)'}`);
console.log(`  GROQ_MODEL: ${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'}`);
console.log(`  GROQ_API_KEY configured: ${Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_key_here')}`);

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        origin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting Configuration
// 1. Dedicated rate limiter for sensitive authentication endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 500, // 500 attempts in development mode
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Global rate limiter for standard workspace API navigation & data operations
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes per IP for normal SPA usage
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/invitations/accept', authLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/search', searchRoutes);

// Base route
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to DevFlow API Server',
    health: '/api/health',
    auth: '/api/auth',
    crm: '/api/crm',
    projects: '/api/projects',
    tasks: '/api/tasks',
    milestones: '/api/milestones',
    users: '/api/users',
    documents: '/api/documents',
    notifications: '/api/notifications',
    activityLogs: '/api/activity-logs',
    dashboard: '/api/dashboard',
    reports: '/api/reports',
    settings: '/api/settings',
    ai: '/api/ai',
  });
});

// Error Handling Middleware
app.use(errorHandler);

// Connect DB & Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[DevFlow Backend] Server running on port ${PORT}`);
  });
};

startServer();
