import app from './app.js';
import { connectDB } from './db.js';

const PORT = process.env.PORT || 5000;

// Start Server for local development and traditional persistent hostings
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 TheHorizon Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

export default app;
