import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { AuthRequest } from '../types/auth';
import { DocumentModel } from '../models/documentModel';
import { ActivityLogModel } from '../models/activityLogModel';
import { ProjectService } from '../services/projectService';
import { ApiError, asyncHandler } from '../utils/errors';

// Helper to stream upload buffer to Cloudinary
function uploadToCloudinaryStream(buffer: Buffer, folder: string, filename: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        use_filename: true,
        filename_override: filename,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}


// Helper to format file size in human-readable units
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper to deduce uppercase short file type (e.g. PDF, DOCX, PNG, FIG)
function deduceFileType(filename: string, mimeType?: string): string {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (ext) {
    if (ext === 'fig') return 'FIGMA';
    return ext.toUpperCase();
  }
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLSX';
    if (mimeType.includes('png')) return 'PNG';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPG';
  }
  return 'FILE';
}

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private (Client restricted to assigned project documents)
export const getDocuments = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  let documents = await DocumentModel.find().sort({ createdAt: -1 });

  if (user && user.role === 'Client') {
    const allProjects = await ProjectService.getProjects();
    const assignedProjectIds = (user.assignedProjects || []).map((id) => id.toString());
    const clientProjects = allProjects.filter((p) => {
      const pId = p._id.toString();
      const isAssigned = assignedProjectIds.includes(pId);
      const isMember = (p.members || []).some(
        (m) => m.id === user._id.toString() || m.email === user.email
      );
      return isAssigned || isMember;
    });

    const clientProjectIds = new Set(clientProjects.map((p) => p._id.toString()));
    const clientProjectNames = clientProjects.map((p) => p.name.toLowerCase());

    documents = documents.filter((doc) => {
      if (doc.projectId && clientProjectIds.has(doc.projectId.toString())) {
        return true;
      }
      if (doc.projectName) {
        const docPrjName = doc.projectName.toLowerCase();
        return clientProjectNames.some(
          (cpName) => docPrjName.includes(cpName) || cpName.includes(docPrjName)
        );
      }
      return false;
    });
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
      originalFilename: doc.originalFilename || doc.name,
      size: doc.size,
      sizeBytes: doc.sizeBytes,
      uploadedBy: doc.uploadedBy,
      uploadDate: doc.uploadDate,
      fileType: doc.fileType,
      url: doc.url || `/api/documents/${doc._id}/download`,
    })),
  });
});

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private (Client restricted to assigned project documents)
export const getDocumentById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  if (user && user.role === 'Client') {
    const allProjects = await ProjectService.getProjects();
    const assignedProjectIds = (user.assignedProjects || []).map((id) => id.toString());
    const clientProjects = allProjects.filter((p) => {
      const pId = p._id.toString();
      const isAssigned = assignedProjectIds.includes(pId);
      const isMember = (p.members || []).some(
        (m) => m.id === user._id.toString() || m.email === user.email
      );
      return isAssigned || isMember;
    });

    const clientProjectIds = new Set(clientProjects.map((p) => p._id.toString()));
    const clientProjectNames = clientProjects.map((p) => p.name.toLowerCase());

    const isMatch =
      (doc.projectId && clientProjectIds.has(doc.projectId.toString())) ||
      (doc.projectName &&
        clientProjectNames.some(
          (cpName) =>
            doc.projectName.toLowerCase().includes(cpName) ||
            cpName.includes(doc.projectName.toLowerCase())
        ));

    if (!isMatch) {
      throw new ApiError('You are not authorized to access this document', 403);
    }
  }

  res.status(200).json({
    success: true,
    document: {
      id: doc._id.toString(),
      name: doc.name,
      category: doc.category,
      projectName: doc.projectName,
      projectId: doc.projectId ? doc.projectId.toString() : undefined,
      originalFilename: doc.originalFilename || doc.name,
      size: doc.size,
      sizeBytes: doc.sizeBytes,
      uploadedBy: doc.uploadedBy,
      uploadDate: doc.uploadDate,
      fileType: doc.fileType,
      url: doc.url || `/api/documents/${doc._id}/download`,
    },
  });
});

// @desc    Create / upload document
// @route   POST /api/documents
// @access  Private
export const createDocument = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const file = req.file;

  if (!file) {
    throw new ApiError('Please select a file to upload', 400);
  }

  const { name, category, projectName, projectId } = req.body;

  if (!projectName) {
    // If file uploaded on disk, clean it up before throwing
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new ApiError('Project name is required', 400);
  }

  const documentName = (name && name.trim()) ? name.trim() : file.originalname;
  const sizeFormatted = formatBytes(file.size);
  const derivedFileType = deduceFileType(file.originalname, file.mimetype);

  let fileUrl = '';
  let savedFilePath = '';
  let storedFilename = file.filename || file.originalname;

  const hasCloudinary =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

  if (hasCloudinary && file.buffer) {
    try {
      const folder = process.env.CLOUDINARY_FOLDER || 'devflow_uploads';
      const result = await uploadToCloudinaryStream(file.buffer, folder, file.originalname);
      fileUrl = result.secure_url;
    } catch (cldErr: any) {
      console.error('[Cloudinary Upload Error]', cldErr);
    }
  }

  // Fallback to local storage if Cloudinary not enabled or failed
  if (!fileUrl && file.buffer) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    storedFilename = `${sanitizedBase}-${uniqueSuffix}${ext}`;
    savedFilePath = path.join(uploadDir, storedFilename);
    fs.writeFileSync(savedFilePath, file.buffer);
  } else if (file.path) {
    savedFilePath = file.path;
  }

  const doc = await DocumentModel.create({
    name: documentName,
    category: category || 'Requirement',
    projectName,
    ...(projectId && { projectId }),
    originalFilename: file.originalname,
    storedFilename,
    filePath: savedFilePath,
    mimeType: file.mimetype,
    size: sizeFormatted,
    sizeBytes: file.size,
    uploadedBy: user?.name || 'Authenticated User',
    uploadedById: user?._id,
    fileType: derivedFileType,
    url: fileUrl,
  });

  if (!fileUrl) {
    doc.url = `/api/documents/${doc._id}/download`;
    await doc.save();
  }

  // Log Activity
  await ActivityLogModel.create({
    userName: user?.name || 'User',
    userAvatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    action: 'Document Uploaded',
    entity: doc.name,
    description: `Uploaded document "${doc.name}" (${doc.size}) for project "${doc.projectName}"`,
  });

  res.status(201).json({
    success: true,
    document: {
      id: doc._id.toString(),
      name: doc.name,
      category: doc.category,
      projectName: doc.projectName,
      projectId: doc.projectId ? doc.projectId.toString() : undefined,
      originalFilename: doc.originalFilename,
      size: doc.size,
      sizeBytes: doc.sizeBytes,
      uploadedBy: doc.uploadedBy,
      uploadDate: doc.uploadDate,
      fileType: doc.fileType,
      url: doc.url,
    },
  });
});

// @desc    Download real document file
// @route   GET /api/documents/:id/download
// @access  Private (Client restricted to assigned project documents)
export const downloadDocument = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const doc = await DocumentModel.findById(req.params.id);

  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  // Client RBAC check
  if (user && user.role === 'Client') {
    const allProjects = await ProjectService.getProjects();
    const assignedProjectIds = (user.assignedProjects || []).map((id) => id.toString());
    const clientProjects = allProjects.filter((p) => {
      const pId = p._id.toString();
      const isAssigned = assignedProjectIds.includes(pId);
      const isMember = (p.members || []).some(
        (m) => m.id === user._id.toString() || m.email === user.email
      );
      return isAssigned || isMember;
    });

    const clientProjectIds = new Set(clientProjects.map((p) => p._id.toString()));
    const clientProjectNames = clientProjects.map((p) => p.name.toLowerCase());

    const isMatch =
      (doc.projectId && clientProjectIds.has(doc.projectId.toString())) ||
      (doc.projectName &&
        clientProjectNames.some(
          (cpName) =>
            doc.projectName.toLowerCase().includes(cpName) ||
            cpName.includes(doc.projectName.toLowerCase())
        ));

    if (!isMatch) {
      throw new ApiError('You are not authorized to download this document', 403);
    }
  }

  // If document is hosted on Cloudinary / external storage URL, redirect directly
  if (doc.url && doc.url.startsWith('http')) {
    res.redirect(doc.url);
    return;
  }

  if (!doc.filePath || !fs.existsSync(doc.filePath)) {
    throw new ApiError('Document file content is not available on server storage', 404);
  }

  const absoluteFilePath = path.resolve(doc.filePath);
  const downloadName = doc.originalFilename || doc.name;

  res.download(absoluteFilePath, downloadName, (err) => {
    if (err && !res.headersSent) {
      console.error('[Document Download Error]', err);
    }
  });
});

// @desc    Delete document and unlinks stored file
// @route   DELETE /api/documents/:id
// @access  Private (Super Admin, Admin, Project Manager)
export const deleteDocument = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) {
    throw new ApiError('Document not found', 404);
  }

  // Remove file from disk storage if present
  if (doc.filePath && fs.existsSync(doc.filePath)) {
    try {
      await fs.promises.unlink(doc.filePath);
    } catch (unlinkErr) {
      console.warn(`[Document Delete Warning] Failed to unlink file ${doc.filePath}:`, unlinkErr);
    }
  }

  await DocumentModel.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Document and stored file deleted successfully',
  });
});
