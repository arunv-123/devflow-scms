import { Router } from 'express';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  downloadDocument,
  deleteDocument,
} from '../controllers/documentController';
import { protect, authorize } from '../middleware/authMiddleware';
import { uploadDocumentMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(getDocuments)
  .post(uploadDocumentMiddleware.single('file'), createDocument);

router
  .route('/:id/download')
  .get(downloadDocument);

router
  .route('/:id')
  .get(getDocumentById)
  .delete(authorize('Super Admin', 'Admin', 'Project Manager'), deleteDocument);

export default router;
