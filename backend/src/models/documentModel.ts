import { Schema, model, Document, Types } from 'mongoose';

export type DocumentCategory = 'Requirement' | 'Architecture' | 'Contract' | 'Design' | 'Report';

export interface IDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  category: DocumentCategory;
  projectName: string;
  projectId?: Types.ObjectId;
  originalFilename?: string;
  storedFilename?: string;
  filePath?: string;
  mimeType?: string;
  size: string;
  sizeBytes?: number;
  uploadedBy: string;
  uploadedById?: Types.ObjectId;
  uploadDate: string;
  fileType: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    name: { type: String, required: [true, 'Document name is required'], trim: true },
    category: {
      type: String,
      enum: ['Requirement', 'Architecture', 'Contract', 'Design', 'Report'],
      default: 'Requirement',
    },
    projectName: { type: String, required: [true, 'Project name is required'], trim: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    originalFilename: { type: String },
    storedFilename: { type: String },
    filePath: { type: String },
    mimeType: { type: String },
    size: { type: String, default: '0 KB' },
    sizeBytes: { type: Number, default: 0 },
    uploadedBy: { type: String, required: true },
    uploadedById: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
    fileType: { type: String, default: 'FILE' },
    url: { type: String, default: '' },
  },
  { timestamps: true }
);

export const DocumentModel = model<IDocument>('Document', documentSchema);
