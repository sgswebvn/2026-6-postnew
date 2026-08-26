import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { connectDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API Router
app.use('/api', apiRouter);

// Root Status
app.get('/', (req, res) => {
  res.json({
    name: 'The Horizon Post - US Editorial Blog MongoDB API Server',
    version: '2.0.0',
    endpoints: {
      status: '/api/status',
      posts: '/api/posts',
      categories: '/api/categories',
      authors: '/api/authors',
      settings: '/api/settings',
      comments: '/api/comments',
      subscribers: '/api/subscribers'
    }
  });
});

// Start Server and Connect DB
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 [Server] The Horizon Post API running on port ${PORT}`);
    console.log(`🔗 [Endpoint] http://localhost:${PORT}/api/status`);
    console.log(`=======================================================`);
  });
}

startServer();

export default app;
