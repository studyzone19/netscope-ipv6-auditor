import express from 'express';
import {
  createAudit,
  listAudits,
  getAuditById,
  getAuditResources,
  getAuditGraph,
  analyzeUrl,
  getAuditFindings,
  getAuditReport,
  getAuditNotes,
} from '../controllers/auditController.js';

const router = express.Router();

// Pre-flight URL & Typo Analysis
router.post('/analyze-url', analyzeUrl);

// Standard Audit Operations
router.post('/', createAudit);
router.get('/', listAudits);
router.get('/:id', getAuditById);
router.get('/:id/resources', getAuditResources);
router.get('/:id/graph', getAuditGraph);

// Smart Explanation Engine & Easy Notes Endpoints
router.get('/:id/findings', getAuditFindings);
router.get('/:id/report', getAuditReport);
router.get('/:id/notes', getAuditNotes);

export default router;
