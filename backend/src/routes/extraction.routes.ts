import { Router } from 'express';
import { extractChapter } from '../controllers/extraction.controller';

const router = Router();

router.post('/extract', extractChapter);

export default router;
