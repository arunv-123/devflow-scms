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
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All task routes require authentication
router.use(protect);

// RBAC is enforced inside each controller handler
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);

// Subtask endpoints – RBAC enforced inside controller
router.post('/:id/subtasks', addSubtask);
router.route('/:id/subtasks/:subtaskId').put(updateSubtask).delete(deleteSubtask);

export default router;
