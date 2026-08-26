import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from '../server/routes/api.js';
import { connectDB } from '../server/db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure database connection in serverless lifecycle
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Mount /api routes
app.use('/api', apiRouter);

// Root Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString()
  });
});

export default app;
