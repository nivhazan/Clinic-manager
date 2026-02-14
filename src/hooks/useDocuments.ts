import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsService } from '@/services/documents'
import { runOcr } from '@/services/ocr'
import type { CreateDocumentData, UpdateDocumentData } from '@/services/documents'
import type { DocumentOwnerType } from '@/types'

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: () => documentsService.getAll(),
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsService.getById(id),
    enabled: !!id,
  })
}

export function useDocumentsByOwner(ownerType: DocumentOwnerType, ownerId: string) {
  return useQuery({
    queryKey: ['documents', ownerType, ownerId],
    queryFn: () => documentsService.getByOwner(ownerType, ownerId),
    enabled: !!ownerId,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateDocumentData) => {
      // Create document with pending OCR status
      const doc = await documentsService.create(data)

      // Start OCR processing in background
      processOcrInBackground(doc.id, data.fileData, queryClient)

      return doc
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentData }) =>
      documentsService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents', id] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useRetryOcr() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const doc = await documentsService.getById(id)
      if (!doc) throw new Error('Document not found')

      // Set status to processing
      await documentsService.update(id, { ocrStatus: 'processing', ocrError: undefined })

      // Run OCR
      processOcrInBackground(id, doc.fileData, queryClient)

      return doc
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents', id] })
    },
  })
}

// Background OCR processing
async function processOcrInBackground(
  documentId: string,
  fileData: string,
  queryClient: ReturnType<typeof useQueryClient>
) {
  try {
    // Update status to processing
    await documentsService.update(documentId, { ocrStatus: 'processing' })
    queryClient.invalidateQueries({ queryKey: ['documents'] })

    // Run OCR
    const result = await runOcr(fileData)

    // Update with results
    await documentsService.update(documentId, {
      ocrStatus: 'done',
      ocrText: result.text,
      extractedFields: result.extractedFields,
    })

    queryClient.invalidateQueries({ queryKey: ['documents'] })
  } catch (error) {
    // Update with error
    await documentsService.update(documentId, {
      ocrStatus: 'failed',
      ocrError: error instanceof Error ? error.message : 'OCR processing failed',
    })

    queryClient.invalidateQueries({ queryKey: ['documents'] })
  }
}
