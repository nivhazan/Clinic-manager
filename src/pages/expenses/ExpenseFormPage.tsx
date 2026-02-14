import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Receipt } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardContent, toast } from '@/components/ui'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { GenericForm } from '@/components/crud'
import { DocumentUpload, DocumentList, DocumentViewer } from '@/components/documents'
import { expensesConfig } from '@/features/expenses/expenses.config'
import { expensesCrudHooks } from '@/hooks/useExpenses'
import { useDocument } from '@/hooks/useDocuments'
import type { Document, ExtractedFields } from '@/types'
import type { CreateExpenseData, UpdateExpenseData } from '@/services/expenses'

export default function ExpenseFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const { data: item, isLoading: itemLoading } = expensesCrudHooks.useItem(id ?? '')
  const createMutation = expensesCrudHooks.useCreate()
  const updateMutation = expensesCrudHooks.useUpdate()

  const [initialValues, setInitialValues] = useState<Record<string, unknown>>({})
  const [formKey, setFormKey] = useState(0)

  // Document state
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null)

  // Fetch uploaded document for OCR panel
  const { data: uploadedDoc } = useDocument(uploadedDocId ?? '')

  // Set initial values when item loads
  useEffect(() => {
    if (item) {
      setInitialValues(expensesConfig.toFormData(item))
    }
  }, [item])

  // When document OCR completes, show it for review
  useEffect(() => {
    if (uploadedDoc && uploadedDoc.ocrStatus === 'done' && !viewingDoc) {
      setViewingDoc(uploadedDoc)
    }
  }, [uploadedDoc, viewingDoc])

  // Handle OCR field application
  const handleApplyFields = useCallback((fields: ExtractedFields) => {
    setInitialValues(prev => ({
      ...prev,
      ...(fields.amount !== undefined && { amount: fields.amount }),
      ...(fields.date && { date: fields.date }),
      ...(fields.vendor && { vendor: fields.vendor }),
    }))
    // Force form re-render with new values
    setFormKey(k => k + 1)
    toast.success({ title: 'השדות הוחלו על הטופס' })
  }, [])

  async function handleSubmit(values: Record<string, unknown>) {
    const data = expensesConfig.fromFormData(values)

    if (isEdit) {
      updateMutation.mutate(
        { id: id!, data: data as UpdateExpenseData },
        {
          onSuccess: () => {
            toast.success({ title: 'הוצאה עודכנה בהצלחה' })
            navigate('/expenses')
          },
          onError: () => {
            toast.error({ title: 'שגיאה בעדכון ההוצאה' })
          },
        }
      )
    } else {
      createMutation.mutate(data as CreateExpenseData, {
        onSuccess: () => {
          toast.success({ title: 'הוצאה נוצרה בהצלחה' })
          navigate('/expenses')
        },
        onError: () => {
          toast.error({ title: 'שגיאה ביצירת ההוצאה' })
        },
      })
    }
  }

  function handleCancel() {
    navigate('/expenses')
  }

  function handleUploadComplete(docId: string) {
    setUploadedDocId(docId)
  }

  // Loading state
  if (isEdit && itemLoading) {
    return (
      <div>
        <PageHeader title="עריכת הוצאה" backTo="/expenses" />
        <div className="space-y-6 max-w-4xl">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <PageHeader
        title={isEdit ? 'עריכת הוצאה' : 'הוצאה חדשה'}
        backTo="/expenses"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        {/* Form - takes 2 columns */}
        <div className="lg:col-span-2">
          <GenericForm
            key={formKey}
            config={expensesConfig.form}
            initialValues={isEdit ? initialValues : initialValues}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isPending}
          />
        </div>

        {/* Document Upload Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                סריקת קבלה / חשבונית
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                העלה קבלה או חשבונית וקבל מילוי אוטומטי של השדות
              </p>
              <DocumentUpload
                ownerType="expense"
                ownerId={id}
                onUploadComplete={handleUploadComplete}
              />

              {/* Show processing status */}
              {uploadedDoc && uploadedDoc.ocrStatus === 'processing' && (
                <div className="text-sm text-center text-muted-foreground animate-pulse">
                  מעבד את המסמך...
                </div>
              )}

              {/* Show documents if editing */}
              {isEdit && id && (
                <DocumentList
                  ownerType="expense"
                  ownerId={id}
                  onViewDocument={setViewingDoc}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={viewingDoc}
        isOpen={!!viewingDoc}
        onClose={() => setViewingDoc(null)}
        onApplyFields={handleApplyFields}
      />
    </div>
  )
}
