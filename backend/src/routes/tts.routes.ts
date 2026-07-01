import { Router } from 'express';
import { synthesizeAudio } from '../controllers/tts.controller';

const router = Router();

router.post('/synthesize', synthesizeAudio);

export default router;
