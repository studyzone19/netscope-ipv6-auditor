import express from 'express';
import { getManifest, validateLab } from '../controllers/labController.js';

const router = express.Router();

router.get('/manifest', getManifest);
router.post('/validate', validateLab);

export default router;
