import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

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
