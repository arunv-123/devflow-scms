import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  updateSubtask,
  deleteSubtask,
} from '../controllers/projectController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

// Subtask endpoints
router.post('/:id/subtasks', addSubtask);
router.route('/:id/subtasks/:subtaskId').put(updateSubtask).delete(deleteSubtask);

export default router;
