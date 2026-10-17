import express from 'express';
import {
  getBenchmark,
  runBenchmark,
  cancelBenchmark,
} from '../controllers/benchmarkController.js';

const router = express.Router();

router.get('/', getBenchmark);
router.post('/run', runBenchmark);
router.post('/cancel', cancelBenchmark);

export default router;
