import { Router } from 'express';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  deleteDocument,
} from '../controllers/documentController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.route('/').get(getDocuments).post(createDocument);
router
  .route('/:id')
  .get(getDocumentById)
  .delete(authorize('Super Admin', 'Admin', 'Project Manager'), deleteDocument);

export default router;
