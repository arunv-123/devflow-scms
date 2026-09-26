import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { CRMService } from '../services/crmService';
import { asyncHandler } from '../utils/errors';

// @desc    Get CRM summary overview statistics
// @route   GET /api/crm/overview
// @access  Private
export const getCrmOverview = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const stats = await CRMService.getOverview();
  res.status(200).json({ success: true, stats });
});

// ================= LEADS =================

// @desc    Get all leads
// @route   GET /api/crm/leads
// @access  Private
export const getLeads = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const leads = await CRMService.getLeads();
  res.status(200).json({ success: true, count: leads.length, leads });
});

// @desc    Get single lead by ID
// @route   GET /api/crm/leads/:id
// @access  Private
export const getLeadById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const lead = await CRMService.getLeadById(id);
  res.status(200).json({ success: true, lead });
});

// @desc    Create new lead
// @route   POST /api/crm/leads
// @access  Private
export const createLead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const lead = await CRMService.createLead(req.body, req.user?._id?.toString());
  res.status(201).json({ success: true, lead, message: 'Lead created successfully' });
});

// @desc    Update existing lead
// @route   PUT /api/crm/leads/:id
// @access  Private
export const updateLead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const lead = await CRMService.updateLead(id, req.body);
  res.status(200).json({ success: true, lead, message: 'Lead updated successfully' });
});

// @desc    Delete lead
// @route   DELETE /api/crm/leads/:id
// @access  Private
export const deleteLead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await CRMService.deleteLead(id);
  res.status(200).json({ success: true, message: 'Lead deleted successfully' });
});

// @desc    Convert lead into active client
// @route   POST /api/crm/leads/:id/convert
// @access  Private
export const convertLead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const result = await CRMService.convertLeadToClient(id);
  res.status(200).json({
    success: true,
    message: 'Lead converted to active client successfully',
    lead: result.lead,
    client: result.client,
  });
});

// ================= CLIENTS =================

// @desc    Get all clients
// @route   GET /api/crm/clients
// @access  Private
export const getClients = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const clients = await CRMService.getClients();
  res.status(200).json({ success: true, count: clients.length, clients });
});

// @desc    Get single client by ID
// @route   GET /api/crm/clients/:id
// @access  Private
export const getClientById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const client = await CRMService.getClientById(id);
  res.status(200).json({ success: true, client });
});

// @desc    Create new client
// @route   POST /api/crm/clients
// @access  Private
export const createClient = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await CRMService.createClient(req.body, req.user?._id?.toString());
  res.status(201).json({ success: true, client, message: 'Client account created successfully' });
});

// @desc    Update client profile
// @route   PUT /api/crm/clients/:id
// @access  Private
export const updateClient = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const client = await CRMService.updateClient(id, req.body);
  res.status(200).json({ success: true, client, message: 'Client updated successfully' });
});

// @desc    Delete client
// @route   DELETE /api/crm/clients/:id
// @access  Private
export const deleteClient = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await CRMService.deleteClient(id);
  res.status(200).json({ success: true, message: 'Client deleted successfully' });
});

// ================= MEETINGS =================

// @desc    Get all meetings
// @route   GET /api/crm/meetings
// @access  Private
export const getMeetings = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const meetings = await CRMService.getMeetings();
  res.status(200).json({ success: true, count: meetings.length, meetings });
});

// @desc    Get single meeting by ID
// @route   GET /api/crm/meetings/:id
// @access  Private
export const getMeetingById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const meeting = await CRMService.getMeetingById(id);
  res.status(200).json({ success: true, meeting });
});

// @desc    Schedule new meeting
// @route   POST /api/crm/meetings
// @access  Private
export const createMeeting = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const meeting = await CRMService.createMeeting(req.body, req.user?._id?.toString());
  res.status(201).json({ success: true, meeting, message: 'Meeting scheduled successfully' });
});

// @desc    Update meeting details
// @route   PUT /api/crm/meetings/:id
// @access  Private
export const updateMeeting = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const meeting = await CRMService.updateMeeting(id, req.body);
  res.status(200).json({ success: true, meeting, message: 'Meeting updated successfully' });
});

// @desc    Delete meeting
// @route   DELETE /api/crm/meetings/:id
// @access  Private
export const deleteMeeting = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id as string;
  await CRMService.deleteMeeting(id);
  res.status(200).json({ success: true, message: 'Meeting deleted successfully' });
});
