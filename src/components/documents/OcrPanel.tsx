import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertCircle, Copy, Wand2 } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardContent, Input, FormField, Badge, toast } from '@/components/ui'
import { useRetryOcr } from '@/hooks/useDocuments'
import type { Document, ExtractedFields } from '@/types'

interface OcrPanelProps {
  document: Document
  onApply?: (fields: ExtractedFields) => void
}

export function OcrPanel({ document, onApply }: OcrPanelProps) {
  const retryMutation = useRetryOcr()

  // Editable fields (user can correct OCR results)
  const [editedFields, setEditedFields] = useState<ExtractedFields>({})

  // Initialize with extracted fields
  useEffect(() => {
    if (document.extractedFields) {
      setEditedFields(document.extractedFields)
    }
  }, [document.extractedFields])

  function handleFieldChange(field: keyof ExtractedFields, value: string | number) {
    setEditedFields(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  function handleApply() {
    onApply?.(editedFields)
    toast.success({ title: 'השדות הוחלו בהצלחה' })
  }

  function handleRetry() {
    retryMutation.mutate(document.id)
  }

  function copyText() {
    if (document.ocrText) {
      navigator.clipboard.writeText(document.ocrText)
      toast.success({ title: 'הטקסט הועתק ללוח' })
    }
  }

  // Processing state
  if (document.ocrStatus === 'pending' || document.ocrStatus === 'processing') {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-sm font-medium">
            {document.ocrStatus === 'pending' ? 'ממתין לסריקה...' : 'מעבד את המסמך...'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">זה עשוי לקחת מספר שניות</p>
        </CardContent>
      </Card>
    )
  }

  // Failed state
  if (document.ocrStatus === 'failed') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-3" />
          <p className="text-sm font-medium text-red-700">הסריקה נכשלה</p>
          {document.ocrError && (
            <p className="text-xs text-red-600 mt-1">{document.ocrError}</p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={handleRetry}
            loading={retryMutation.isPending}
          >
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Success state - show extracted fields
  return (
    <div className="space-y-4">
      {/* Extracted Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            שדות שזוהו
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount */}
          <FormField label="סכום" htmlFor="ocr-amount">
            <div className="flex items-center gap-2">
              <Input
                id="ocr-amount"
                type="number"
                step="0.01"
                dir="ltr"
                value={editedFields.amount ?? ''}
                onChange={e => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="לא זוהה"
              />
              {editedFields.confidence?.amount && (
                <ConfidenceBadge value={editedFields.confidence.amount} />
              )}
            </div>
          </FormField>

          {/* Date */}
          <FormField label="תאריך" htmlFor="ocr-date">
            <div className="flex items-center gap-2">
              <Input
                id="ocr-date"
                type="date"
                value={editedFields.date ?? ''}
                onChange={e => handleFieldChange('date', e.target.value)}
              />
              {editedFields.confidence?.date && (
                <ConfidenceBadge value={editedFields.confidence.date} />
              )}
            </div>
          </FormField>

          {/* Vendor */}
          <FormField label="ספק" htmlFor="ocr-vendor">
            <div className="flex items-center gap-2">
              <Input
                id="ocr-vendor"
                type="text"
                value={editedFields.vendor ?? ''}
                onChange={e => handleFieldChange('vendor', e.target.value)}
                placeholder="לא זוהה"
              />
              {editedFields.confidence?.vendor && (
                <ConfidenceBadge value={editedFields.confidence.vendor} />
              )}
            </div>
          </FormField>

          {/* Document Number */}
          <FormField label="מספר מסמך" htmlFor="ocr-docNumber">
            <div className="flex items-center gap-2">
              <Input
                id="ocr-docNumber"
                type="text"
                value={editedFields.docNumber ?? ''}
                onChange={e => handleFieldChange('docNumber', e.target.value)}
                placeholder="לא זוהה"
              />
              {editedFields.confidence?.docNumber && (
                <ConfidenceBadge value={editedFields.confidence.docNumber} />
              )}
            </div>
          </FormField>

          {/* Apply Button */}
          {onApply && (
            <Button
              className="w-full"
              leftIcon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleApply}
            >
              החל על הטופס
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Raw OCR Text */}
      {document.ocrText && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">טקסט גולמי</CardTitle>
              <Button variant="ghost" size="icon" onClick={copyText} title="העתק">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto bg-muted/50 rounded-md p-3 text-xs font-mono whitespace-pre-wrap">
              {document.ocrText}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ConfidenceBadge({ value }: { value: number }) {
  const percentage = Math.round(value * 100)
  const variant = percentage >= 70 ? 'success' : percentage >= 40 ? 'warning' : 'danger'

  return (
    <Badge variant={variant} size="sm" className="flex-shrink-0">
      {percentage}%
    </Badge>
  )
}
