// routes/portfolioRoutes.ts
import express, { Router } from 'express';
// استيراد الـ Controller اللي عملناه
import { createPortfolio, getAllPortfolio, deletePortfolio } from '../Controllers/portfolioController';
import upload from '../Middlewares/uploadMiddleware';
const router: Router = express.Router();

/**
 * @route   POST /api/v1/portfolio
 * @desc    إضافة عمل جديد لمعرض الأعمال
 * @access  Private (حالياً مفتوحة للتجربة)
 */
router.get('/', getAllPortfolio)
router.post('/', upload.single('image'), createPortfolio);
router.delete('/:id', deletePortfolio);
// في الـ TypeScript بنستخدم export default
export default router;