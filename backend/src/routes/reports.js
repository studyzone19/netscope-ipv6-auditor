import express from 'express';
import { getReportJson, getReportCsv } from '../controllers/reportController.js';

const router = express.Router();

router.get('/:id/json', getReportJson);
router.get('/:id/csv', getReportCsv);

export default router;
