import { Request, Response } from 'express';
import { z } from 'zod';
import { ttsService } from '../services/tts/google.tts.service';

const synthesizeSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(50000, 'Text exceeds maximum length of 50000 characters'),
  voice: z.string().optional()
});

export const synthesizeAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voice } = synthesizeSchema.parse(req.body);
    
    // Process text as requested by PRD: "Never summarize. Never paraphrase."
    // The TTS service directly processes what we pass it.
    const audioBuffer = await ttsService.synthesize(text, voice);
    
    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    
    res.status(200).send(audioBuffer);
  } catch (error: any) {
    console.error('TTS Controller Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to synthesize audio'
    });
  }
};
