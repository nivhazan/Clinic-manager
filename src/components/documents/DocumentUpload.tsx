import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, X, FileText } from 'lucide-react'
import { Button, Card, CardContent, toast } from '@/components/ui'
import { useCreateDocument } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'
import { validateFileBytes, createUploadRateLimiter } from '@/lib/upload-security'
import type { DocumentOwnerType, DocumentFileType } from '@/types'

interface DocumentUploadProps {
  ownerType: DocumentOwnerType
  ownerId?: string
  onUploadComplete?: (documentId: string) => void
  className?: string
}

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

// Rate limiter: 5 uploads per 60 seconds
const uploadRateLimiter = createUploadRateLimiter(5, 60_000)

export function DocumentUpload({
  ownerType,
  ownerId,
  onUploadComplete,
  className,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const createMutation = useCreateDocument()

  const handleFile = useCallback(async (file: File) => {
    // Validate file type (extension-based)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error({ title: 'סוג קובץ לא נתמך', description: 'יש להעלות PDF או תמונה (JPG, PNG, WebP)' })
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error({ title: 'הקובץ גדול מדי', description: 'גודל מקסימלי: 15MB' })
      return
    }

    // Validate magic bytes (defense-in-depth)
    const validBytes = await validateFileBytes(file)
    if (!validBytes) {
      toast.error({ title: 'קובץ לא תקין', description: 'תוכן הקובץ אינו תואם לסוג הקובץ המוצהר' })
      return
    }

    // Rate limiting
    if (!uploadRateLimiter.canUpload()) {
      toast.error({ title: 'יותר מדי העלאות', description: 'נא להמתין דקה לפני העלאה נוספת' })
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleUpload = async () => {
    if (!selectedFile || !preview) return

    const fileType = getFileType(selectedFile.type)
    if (!fileType) return

    createMutation.mutate(
      {
        ownerType,
        ownerId,
        fileData: preview,
        fileType,
        originalFileName: selectedFile.name,
        fileSizeBytes: selectedFile.size,
      },
      {
        onSuccess: (doc) => {
          toast.success({ title: 'המסמך הועלה בהצלחה', description: 'מתחיל סריקת OCR...' })
          setPreview(null)
          setSelectedFile(null)
          onUploadComplete?.(doc.id)
        },
        onError: () => {
          toast.error({ title: 'שגיאה בהעלאת המסמך' })
        },
      }
    )
  }

  const clearSelection = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className={className}>
      {!preview ? (
        <Card
          className={cn(
            'border-2 border-dashed transition-colors cursor-pointer',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">גרור קובץ לכאן או לחץ לבחירה</p>
            <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WebP (עד 15MB)</p>

            <div className="flex items-center gap-3 mt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                בחר קובץ
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Camera className="h-4 w-4" />}
                onClick={(e) => {
                  e.stopPropagation()
                  cameraInputRef.current?.click()
                }}
              >
                צלם מסמך
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {selectedFile?.type === 'application/pdf' ? (
                  <FileText className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <img
                    src={preview}
                    alt="תצוגה מקדימה"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={clearSelection}
                  className="absolute top-1 end-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatFileSize(selectedFile?.size ?? 0)}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    loading={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'מעלה...' : 'העלה וסרוק'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={clearSelection}
                    disabled={createMutation.isPending}
                  >
                    ביטול
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

function getFileType(mimeType: string): DocumentFileType | null {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'application/pdf':
      return 'pdf'
    default:
      return null
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
