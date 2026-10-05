import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);
router.get('/', globalSearch);

export default router;
