import { Request, Response } from 'express';
import mongoose from 'mongoose';

export const getHealth = (_req: Request, res: Response): void => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'ok',
    service: 'DevFlow API Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatusMap[dbState] || 'unknown',
    },
  });
};
