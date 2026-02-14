# Project Conventions — Clinic Management App

## UI Freeze: Design System Required

All new features **MUST** use DS primitives from `@/components/ui`.

### Forbidden Raw HTML

Do NOT use raw HTML elements in pages or feature components:

- `<button>` — use `<Button>` from `@/components/ui`
- `<input>` — use `<Input>` from `@/components/ui`
- `<table>` — use `<Table>` from `@/components/ui`
- `<select>` — use `<Select>` or `<NativeSelect>` from `@/components/ui`

### Layout Pattern

List pages must use:
- `PageHeader` from `@/components/layout` — for title + primary action
- `FilterBar` from `@/components/layout` — for search + filter controls

### Forms

- Use `FormField` from `@/components/ui` for all form fields
- Use `FormSection` pattern for grouping related fields

### CRUD Builder

For standard list/form screens, prefer:
- `CrudListPage` from `@/components/crud` — auto-generates list, filters, delete
- `CrudFormPage` from `@/components/crud` — auto-generates create/edit forms

See `src/features/expenses/expenses.config.ts` as reference.

### No `confirm()`

Never use `window.confirm()` or `confirm()`. Always use `<ConfirmDialog>` from `@/components/ui`.

## Upload Rules

### DocumentFileType

Defined in `src/types/index.ts`:

```ts
type DocumentFileType = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'webp'
```

### ALLOWED_FILE_TYPES (server-side)

Defined in `src/services/documents.ts` — used for defense-in-depth validation in `create()`:

```ts
const ALLOWED_FILE_TYPES: DocumentFileType[] = ['jpg', 'png', 'webp', 'pdf']
```

Note: `'jpeg'` exists in `DocumentFileType` for compatibility but is never produced by the upload component's `getFileType()` mapper — it always maps `image/jpeg` to `'jpg'`.

### Document Owner Types

Defined in `src/types/index.ts`:

```ts
type DocumentOwnerType = 'payment' | 'expense' | 'patient' | 'session' | 'other'
```

Documents are linked to their parent entity via `ownerType` + `ownerId`. When deleting a parent (patient, payment, expense), check for linked documents and warn the user — documents are **not** cascade-deleted.

### Validation Pipeline

1. **Extension-based MIME check** — `ACCEPTED_TYPES` in `DocumentUpload.tsx` (client)
2. **Magic byte validation** — `validateFileBytes()` from `@/lib/upload-security` reads first 12 bytes, matches JPG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`RIFF...WEBP`), PDF (`%PDF`)
3. **Rate limiting** — `createUploadRateLimiter(5, 60_000)` — 5 uploads per 60s sliding window
4. **Server-side defense** — `documentsService.create()` rejects unknown `fileType` and files > 15MB

- Max file size: **15MB** (both client and service layer)
- MIME validation: Magic byte check via `validateFileBytes()` from `@/lib/upload-security`
- Rate limiting: 5 uploads per 60 seconds via `createUploadRateLimiter()`
- Allowed types: JPG, PNG, WebP, PDF

## Safe Deletion

When deleting entities that may have linked documents:
- Check document count before showing delete confirmation
- Warn user: "למטופל/להוצאה/לתשלום זה X מסמכים מצורפים. המסמכים לא יימחקו."
- For CRUD configs, use `getDeleteWarning` callback

## DS Compliance Tracker

| Page | DS Compliant | Notes |
|------|:---:|-------|
| PatientsPage | Yes | PageHeader + FilterBar + Table + ConfirmDialog |
| PatientProfilePage | Partial | Tabs still use raw buttons, profile header uses DS Button |
| PaymentsPage | Yes | PageHeader + FilterBar + Tabs + Table + ConfirmDialog |
| ExpensesPage (CRUD) | Yes | Uses CrudListPage/CrudFormPage |
| DashboardPage | Partial | Needs review |
| CalendarPage | Partial | Needs review |
| SessionsPage | Partial | Needs review |
