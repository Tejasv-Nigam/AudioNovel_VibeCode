import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import extractionRoutes from './routes/extraction.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
