import type { Document, DocumentOwnerType, DocumentFileType, OcrStatus, ExtractedFields } from '@/types'
import { getAll, setAll, generateId, now } from './api'

const KEY = 'clinic_documents'

const ALLOWED_FILE_TYPES: DocumentFileType[] = ['jpg', 'png', 'webp', 'pdf']
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB

export interface CreateDocumentData {
  ownerType: DocumentOwnerType
  ownerId?: string
  fileData: string
  fileType: DocumentFileType
  originalFileName: string
  fileSizeBytes: number
}

export interface UpdateDocumentData {
  ownerId?: string
  ocrStatus?: OcrStatus
  ocrText?: string
  extractedFields?: ExtractedFields
  ocrError?: string
}

export const documentsService = {
  async getAll(): Promise<Document[]> {
    return getAll<Document>(KEY)
  },

  async getById(id: string): Promise<Document | undefined> {
    return getAll<Document>(KEY).find(d => d.id === id)
  },

  async getByOwner(ownerType: DocumentOwnerType, ownerId: string): Promise<Document[]> {
    return getAll<Document>(KEY).filter(d => d.ownerType === ownerType && d.ownerId === ownerId)
  },

  async getCountByOwner(ownerType: DocumentOwnerType, ownerId: string): Promise<number> {
    return getAll<Document>(KEY).filter(d => d.ownerType === ownerType && d.ownerId === ownerId).length
  },

  async create(data: CreateDocumentData): Promise<Document> {
    // Defense-in-depth: validate file type
    if (!ALLOWED_FILE_TYPES.includes(data.fileType)) {
      throw new Error(`סוג קובץ לא מורשה: ${data.fileType}`)
    }
    // Defense-in-depth: validate file size
    if (data.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error(`הקובץ חורג מהגודל המקסימלי (${MAX_FILE_SIZE_BYTES} bytes)`)
    }

    const documents = getAll<Document>(KEY)
    const document: Document = {
      ...data,
      id: generateId(),
      uploadedAt: now(),
      ocrStatus: 'pending',
      createdAt: now(),
      updatedAt: now(),
    }
    documents.push(document)
    setAll(KEY, documents)
    return document
  },

  async update(id: string, data: UpdateDocumentData): Promise<Document> {
    const documents = getAll<Document>(KEY)
    const index = documents.findIndex(d => d.id === id)
    if (index === -1) throw new Error('Document not found')
    documents[index] = { ...documents[index], ...data, updatedAt: now() }
    setAll(KEY, documents)
    return documents[index]
  },

  async remove(id: string): Promise<void> {
    const documents = getAll<Document>(KEY).filter(d => d.id !== id)
    setAll(KEY, documents)
  },

  async linkToOwner(id: string, _ownerType: DocumentOwnerType, ownerId: string): Promise<Document> {
    return this.update(id, { ownerId })
  },
}
