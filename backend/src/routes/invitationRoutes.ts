import { Router } from 'express';
import {
  inviteUser,
  validateInvitationToken,
  acceptInvitation,
  resendInvitation,
  cancelInvitation,
} from '../controllers/invitationController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Public onboarding routes for token validation and activation
router.get('/:token', validateInvitationToken);
router.post('/accept', acceptInvitation);

// Protected routes for managing invitations
router.use(protect);
router.post('/', authorize('Super Admin', 'Admin', 'Project Manager'), inviteUser);
router.post('/resend/:id', authorize('Super Admin', 'Admin', 'Project Manager'), resendInvitation);
router.post('/cancel/:id', authorize('Super Admin', 'Admin'), cancelInvitation);

export default router;
