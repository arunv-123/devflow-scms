import { Router } from 'express';
import {
  getCrmOverview,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from '../controllers/crmController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

// Protect all CRM routes for authenticated users
router.use(protect);

// Overview
router.get('/overview', authorize('Super Admin', 'Admin', 'Project Manager'), getCrmOverview);

// Leads Routes
router.route('/leads')
  .get(authorize('Super Admin', 'Admin', 'Project Manager'), getLeads)
  .post(authorize('Super Admin', 'Admin', 'Project Manager'), createLead);
router.route('/leads/:id')
  .get(authorize('Super Admin', 'Admin', 'Project Manager'), getLeadById)
  .put(authorize('Super Admin', 'Admin', 'Project Manager'), updateLead)
  .delete(authorize('Super Admin', 'Admin'), deleteLead);
router.post('/leads/:id/convert', authorize('Super Admin', 'Admin', 'Project Manager'), convertLead);

// Clients Routes
router.route('/clients')
  .get(authorize('Super Admin', 'Admin', 'Project Manager'), getClients)
  .post(authorize('Super Admin', 'Admin', 'Project Manager'), createClient);
router.route('/clients/:id')
  .get(authorize('Super Admin', 'Admin', 'Project Manager'), getClientById)
  .put(authorize('Super Admin', 'Admin', 'Project Manager'), updateClient)
  .delete(authorize('Super Admin', 'Admin'), deleteClient);

// Meetings Routes (accessible by PM, Admin, Super Admin, Project Coordinator, and Client for view)
router.route('/meetings')
  .get(authorize('Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Client'), getMeetings)
  .post(authorize('Super Admin', 'Admin', 'Project Manager', 'Project Coordinator'), createMeeting);
router.route('/meetings/:id')
  .get(authorize('Super Admin', 'Admin', 'Project Manager', 'Project Coordinator', 'Client'), getMeetingById)
  .put(authorize('Super Admin', 'Admin', 'Project Manager', 'Project Coordinator'), updateMeeting)
  .delete(authorize('Super Admin', 'Admin', 'Project Manager'), deleteMeeting);

export default router;
