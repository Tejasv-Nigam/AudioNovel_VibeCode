import { ITTSService } from './tts.interface';
import * as googleTTS from 'google-tts-api';

export class GoogleTTSService implements ITTSService {
  /**
   * Synthesizes text using google-tts-api.
   * Handles text chunking automatically if text exceeds the API limit (200 chars).
   */
  async synthesize(text: string, voice?: string): Promise<Buffer> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is empty');
    }

    // Attempt to map "male" to a locale that often provides a male voice
    // Note: google-tts-api scrapes Translate TTS which doesn't explicitly guarantee genders, 
    // but 'en-GB' or 'en-NG' often result in a male/different tone.
    let lang = 'en';
    if (voice === 'male') lang = 'en-GB';
    if (voice === 'female') lang = 'en-US';

    try {
      // The google-tts-api handles splitting the text into chunks
      // and fetching the audio base64 data.
      const results = await googleTTS.getAllAudioBase64(text, {
        lang: lang,
        slow: false,
        host: 'https://translate.google.com',
        splitPunct: ',.?',
      });

      // results is an array of objects: { shortText: string, base64: string }
      // We need to decode the base64 and concatenate into a single buffer
      const buffers = results.map(res => Buffer.from(res.base64, 'base64'));
      return Buffer.concat(buffers);
      
    } catch (error) {
      console.error('Google TTS Synthesis Error:', error);
      throw new Error('Failed to synthesize audio');
    }
  }
}

export const ttsService: ITTSService = new GoogleTTSService();
