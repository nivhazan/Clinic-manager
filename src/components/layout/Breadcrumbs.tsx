import { useLocation, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { BREADCRUMB_LABELS } from '@/lib/constants'
import { usePatient } from '@/hooks/usePatients'

export function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  const patientsIdx = segments.indexOf('patients')
  const candidateId = patientsIdx >= 0 ? segments[patientsIdx + 1] : undefined
  const patientId = candidateId && !BREADCRUMB_LABELS[candidateId] ? candidateId : undefined
  const { data: patient } = usePatient(patientId ?? '')

  if (segments.length === 0) return null

  function resolveLabel(segment: string, index: number): string {
    if (BREADCRUMB_LABELS[segment]) {
      if (segment === 'edit' && index >= 2 && segments[index - 2] === 'patients') {
        return 'עריכת מטופל'
      }
      return BREADCRUMB_LABELS[segment]
    }

    const parent = index >= 1 ? segments[index - 1] : undefined
    if (parent === 'patients') {
      return patient?.fullName ?? 'כרטיס מטופל'
    }

    return segment
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/')
        const label = resolveLabel(segment, index)
        const isLast = index === segments.length - 1

        return (
          <span key={path} className="flex items-center gap-1">
            {index > 0 && <ChevronLeft className="h-4 w-4" />}
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
