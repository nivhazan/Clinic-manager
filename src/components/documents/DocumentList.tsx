import { useState } from 'react'
import { FileText, Image as ImageIcon, Trash2, Eye, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button, Badge, Card, CardContent, ConfirmDialog, toast } from '@/components/ui'
import { useDocumentsByOwner, useDeleteDocument, useRetryOcr } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'
import type { Document, DocumentOwnerType, OcrStatus } from '@/types'

interface DocumentListProps {
  ownerType: DocumentOwnerType
  ownerId: string
  onViewDocument?: (doc: Document) => void
  className?: string
}

const ocrStatusLabels: Record<OcrStatus, string> = {
  pending: 'ממתין',
  processing: 'מעבד',
  done: 'הושלם',
  failed: 'נכשל',
}

const ocrStatusVariants: Record<OcrStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  pending: 'neutral',
  processing: 'info',
  done: 'success',
  failed: 'danger',
}

export function DocumentList({ ownerType, ownerId, onViewDocument, className }: DocumentListProps) {
  const { data: documents = [], isLoading } = useDocumentsByOwner(ownerType, ownerId)
  const deleteMutation = useDeleteDocument()
  const retryMutation = useRetryOcr()

  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success({ title: 'המסמך נמחק' })
        setDeleteTarget(null)
      },
      onError: () => {
        toast.error({ title: 'שגיאה במחיקת המסמך' })
      },
    })
  }

  function handleRetry(doc: Document) {
    retryMutation.mutate(doc.id, {
      onSuccess: () => {
        toast.info({ title: 'מתחיל סריקה מחדש...' })
      },
      onError: () => {
        toast.error({ title: 'שגיאה בהפעלת הסריקה' })
      },
    })
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">אין מסמכים מצורפים</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {documents.map(doc => (
        <Card key={doc.id} className="hover:bg-muted/30 transition-colors">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                {doc.fileType === 'pdf' ? (
                  <FileText className="h-5 w-5 text-red-500" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.originalFileName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(doc.uploadedAt)}
                  </span>
                  <OcrStatusBadge status={doc.ocrStatus} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {doc.ocrStatus === 'failed' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRetry(doc)}
                    disabled={retryMutation.isPending}
                    title="נסה שוב"
                  >
                    <RefreshCw className={cn('h-4 w-4', retryMutation.isPending && 'animate-spin')} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDocument?.(doc)}
                  title="צפה"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteTarget(doc)}
                  title="מחק"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* OCR Error */}
            {doc.ocrStatus === 'failed' && doc.ocrError && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                {doc.ocrError}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="מחיקת מסמך"
        message={`האם למחוק את המסמך "${deleteTarget?.originalFileName}"?`}
        confirmText="מחק"
        cancelText="ביטול"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function OcrStatusBadge({ status }: { status: OcrStatus }) {
  const icon = {
    pending: null,
    processing: <Loader2 className="h-3 w-3 animate-spin" />,
    done: <CheckCircle2 className="h-3 w-3" />,
    failed: <AlertCircle className="h-3 w-3" />,
  }[status]

  return (
    <Badge variant={ocrStatusVariants[status]} size="sm" className="gap-1">
      {icon}
      {ocrStatusLabels[status]}
    </Badge>
  )
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}
