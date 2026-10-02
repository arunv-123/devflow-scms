import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(authorize('Super Admin', 'Admin', 'Project Manager'), createProject);

router
  .route('/:id')
  .get(getProjectById)
  .put(authorize('Super Admin', 'Admin', 'Project Manager', 'Team Lead'), updateProject)
  .delete(authorize('Super Admin', 'Admin'), deleteProject);

export default router;
