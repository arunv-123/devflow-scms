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
import { protect } from '../middleware/authMiddleware';

const router = Router();

// Protect all CRM routes
router.use(protect);

// Overview
router.get('/overview', getCrmOverview);

// Leads Routes
router.route('/leads').get(getLeads).post(createLead);
router.route('/leads/:id').get(getLeadById).put(updateLead).delete(deleteLead);
router.post('/leads/:id/convert', convertLead);

// Clients Routes
router.route('/clients').get(getClients).post(createClient);
router.route('/clients/:id').get(getClientById).put(updateClient).delete(deleteClient);

// Meetings Routes
router.route('/meetings').get(getMeetings).post(createMeeting);
router.route('/meetings/:id').get(getMeetingById).put(updateMeeting).delete(deleteMeeting);

export default router;
