import { CrudFormPage } from '@/components/crud'
import { expensesConfig } from '@/features/expenses/expenses.config'
import { expensesCrudHooks } from '@/hooks/useExpenses'

export default function ExpenseFormPage() {
  return (
    <CrudFormPage
      config={expensesConfig}
      hooks={expensesCrudHooks}
    />
  )
}
