import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { DocumentModel } from '../models/documentModel';
import { ActivityLogModel } from '../models/activityLogModel';
import { ApiError, asyncHandler } from '../utils/errors';

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
export const getDocuments = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  let documents = await DocumentModel.find().sort({ createdAt: -1 });

  // Seed sample documents if database is empty
  if (documents.length === 0) {
    documents = await DocumentModel.create([
      {
        name: 'FinTech Nexus Architecture Spec v2.4.pdf',
        category: 'Architecture',
        projectName: 'FinTech Nexus',
        size: '4.2 MB',
        uploadedBy: 'Alex Chen',
        uploadDate: '2026-03-15',
        fileType: 'PDF',
      },
      {
        name: 'HealthPulse Client Service Agreement.pdf',
        category: 'Contract',
        projectName: 'HealthPulse Platform',
        size: '1.8 MB',
        uploadedBy: 'Sarah Jenkins',
        uploadDate: '2026-03-10',
        fileType: 'PDF',
      },
      {
        name: 'DevFlow UI/UX Design System Guidelines.fig',
        category: 'Design',
        projectName: 'DevFlow SCMS',
        size: '14.5 MB',
        uploadedBy: 'Elena Rostova',
        uploadDate: '2026-03-08',
        fileType: 'FIGMA',
      },
      {
        name: 'AI Knowledge Engine Requirements Doc.docx',
        category: 'Requirement',
        projectName: 'AI Knowledge Engine',
        size: '850 KB',
        uploadedBy: 'Marcus Vance',
        uploadDate: '2026-03-01',
        fileType: 'DOCX',
      },
    ]);
  }

  res.status(200).json({
    success: true,
    count: documents.length,
    documents: documents.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      category: doc.category,
      projectName: doc.projectName,
      projectId: doc.projectId ? doc.projectId.toString() : undefined,
      size: doc.size,
      uploadedBy: doc.uploadedBy,
      uploadDate: doc.uploadDate,
      fileType: doc.fileType,
      url: doc.url,
    })),
  });
});

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  res.status(200).json({
    success: true,
    document: {
      id: doc._id.toString(),
      name: doc.name,
      category: doc.category,
      projectName: doc.projectName,
      size: doc.size,
      uploadedBy: doc.uploadedBy,
      uploadDate: doc.uploadDate,
      fileType: doc.fileType,
      url: doc.url,
    },
  });
});

// @desc    Create / upload document
// @route   POST /api/documents
// @access  Private
export const createDocument = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, category, projectName, size, fileType, url } = req.body;
  const user = req.user;

  if (!name || !projectName) {
    throw new ApiError('Document name and project name are required', 400);
  }

  const doc = await DocumentModel.create({
    name,
    category: category || 'Requirement',
    projectName,
    size: size || '1.5 MB',
    uploadedBy: user?.name || 'Authenticated User',
    uploadedById: user?._id,
    fileType: fileType || 'PDF',
    url: url || '',
  });

  // Log Activity
  await ActivityLogModel.create({
    userName: user?.name || 'User',
    userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    action: 'Document Uploaded',
    entity: doc.name,
    description: `Uploaded document "${doc.name}" for project "${doc.projectName}"`,
  });

  res.status(201).json({
    success: true,
    document: {
      id: doc._id.toString(),
      name: doc.name,
      category: doc.category,
      projectName: doc.projectName,
      size: doc.size,
      uploadedBy: doc.uploadedBy,
      uploadDate: doc.uploadDate,
      fileType: doc.fileType,
    },
  });
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Super Admin, Admin, Project Manager)
export const deleteDocument = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  await DocumentModel.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
  });
});
