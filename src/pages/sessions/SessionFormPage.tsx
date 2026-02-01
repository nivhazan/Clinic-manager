import { useParams } from 'react-router-dom'

export default function SessionFormPage() {
  const { id } = useParams()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{id ? 'עריכת טיפול' : 'טיפול חדש'}</h2>
      <p className="text-muted-foreground">טופס בפיתוח...</p>
    </div>
  )
}
