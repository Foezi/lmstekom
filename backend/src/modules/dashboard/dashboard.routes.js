import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/apiError.js';
import { getDashboardData } from './dashboard.service.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await getDashboardData(req.user);
    res.json({ data });
  })
);

export default router;
