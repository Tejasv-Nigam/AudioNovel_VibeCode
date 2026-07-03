import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import timeout from 'connect-timeout';
import rateLimit from 'express-rate-limit';
import extractionRoutes from './routes/extraction.routes';

dotenv.config();

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use(timeout('60s'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Extraction Routes
app.use('/api/extraction', extractionRoutes);

// TTS Routes
import ttsRoutes from './routes/tts.routes';
app.use('/api/tts', ttsRoutes);

export default app;
