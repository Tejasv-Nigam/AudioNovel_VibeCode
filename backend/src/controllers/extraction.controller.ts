import { Request, Response } from 'express';
import { extractorService } from '../services/scraper/extractor';
import { z } from 'zod';

const extractSchema = z.object({
  url: z.string().url('Invalid URL format')
});

export const extractChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = extractSchema.parse(req.body);
    
    const extractedData = await extractorService.extractChapter(url);
    
    res.status(200).json({
      success: true,
      data: extractedData
    });
  } catch (error: any) {
    console.error('Extraction Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to extract chapter'
    });
  }
};
