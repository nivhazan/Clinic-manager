import { useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download, FileText } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { OcrPanel } from './OcrPanel'
import type { Document, ExtractedFields } from '@/types'

interface DocumentViewerProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onApplyFields?: (fields: ExtractedFields) => void
}

export function DocumentViewer({ document, isOpen, onClose, onApplyFields }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  if (!document) return null

  const isPdf = document.fileType === 'pdf'

  function handleZoomIn() {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  function handleZoomOut() {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  function handleRotate() {
    setRotation(prev => (prev + 90) % 360)
  }

  function handleDownload() {
    if (!document) return
    const link = window.document.createElement('a')
    link.href = document.fileData
    link.download = document.originalFileName
    link.click()
  }

  function handleApply(fields: ExtractedFields) {
    onApplyFields?.(fields)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.originalFileName}
      size="full"
      showCloseButton={false}
    >
      <div className="flex flex-col lg:flex-row gap-4 h-[70vh]">
        {/* Document Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleZoomOut} title="הקטן">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} title="הגדל">
                <ZoomIn className="h-4 w-4" />
              </Button>
              {!isPdf && (
                <Button variant="ghost" size="icon" onClick={handleRotate} title="סובב">
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleDownload} title="הורד">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} title="סגור">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto bg-muted/30 rounded-lg mt-3 flex items-center justify-center">
            {isPdf ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="h-16 w-16 mb-3" />
                <p className="text-sm">תצוגת PDF אינה נתמכת בדפדפן</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={handleDownload}>
                  הורד לצפייה
                </Button>
              </div>
            ) : (
              <img
                src={document.fileData}
                alt={document.originalFileName}
                className="max-w-full max-h-full object-contain transition-transform"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            )}
          </div>
        </div>

        {/* OCR Panel */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <OcrPanel document={document} onApply={onApplyFields ? handleApply : undefined} />
        </div>
      </div>
    </Modal>
  )
}
