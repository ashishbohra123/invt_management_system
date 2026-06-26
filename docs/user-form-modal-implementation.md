# UserFormModal — Implementation Walkthrough

## Overview

The `UserFormModal` component replaces the legacy full-page form (`UserForm.tsx`) with a modal dialog for creating and editing users in the Admin Portal. It provides an inline, overlay-based experience so users never leave the list view.

## File Location

```
src/admin-portal/src/pages/Users/
├── UserList.tsx        # Updated to use modal for create/edit
├── UserFormModal.tsx   # NEW — the modal component
├── UserForm.tsx        # Legacy full-page form (kept as reference)
└── index.ts            # Exports new component
```

## Component Architecture

### Props

```typescript
interface UserFormModalProps {
  open: boolean;                    // Controls visibility
  onClose: () => void;             // Called when modal should close
  editUser?: User | null;          // Pass user data for edit mode; null for create
  onSave: () => void;              // Called after successful save (triggers list refresh)
}
```

### Internal State

| State      | Type                         | Purpose                                  |
|------------|------------------------------|------------------------------------------|
| `form`     | `FormState`                  | All form field values                    |
| `saving`   | `boolean`                    | Loading indicator during API call        |
| `errors`   | `Record<string, string>`     | Per-field validation error messages      |
| `toast`    | `Toast \| null`              | Success/error notification               |

### Form Fields

| Field            | Create | Edit | Source                                | Validation               |
|------------------|--------|------|---------------------------------------|--------------------------|
| `name`           | Yes    | Yes  | Free text                             | Required                 |
| `email`          | Yes    | Yes  | Free text (type=email)                | Required + `isValidEmail`|
| `password`       | Yes    | No   | Free text (type=password)             | Required, min 6 chars    |
| `role`           | Yes    | Yes  | `@moc/shared` `Role` enum             | —                        |
| `portalAccess`   | Yes    | Yes  | `@moc/shared` `PortalType` enum       | At least 1 selected      |
| `isActive`       | Yes    | Yes  | Checkbox toggle                        | —                        |

## Key Design Decisions

### 1. Modal Over Native Routing

The legacy `UserForm.tsx` used React Router params (`/users/new`, `/users/:id/edit`). The modal approach eliminates page navigation, allowing the user to:

- Stay on the list view while creating/editing
- See context (search results, pagination) persist
- Cancel without losing list position

### 2. Shared Enums for Role and Portal Access

Roles and portal types come from `@moc/shared`:

```typescript
import { Role, PortalType, isValidEmail } from "@moc/shared";

// Role options rendered from the enum:
const ROLE_OPTIONS = [
  { value: Role.SUPER_ADMIN, label: "Super Admin" },
  { value: Role.ADMIN, label: "Admin" },
  { value: Role.MANAGER, label: "Manager" },
  { value: Role.VIEWER, label: "Viewer" },
];

// Portal access uses checkboxes from PortalType enum:
const PORTAL_OPTIONS = [
  { value: PortalType.ADMIN, label: "Admin Portal" },
  { value: PortalType.PARTNER, label: "Partner Portal" },
  { value: PortalType.CUSTOMER, label: "Customer Portal" },
];
```

### 3. Email Validation

Email format is validated client-side using the shared `isValidEmail` function from `@moc/shared/validators/email`:

```typescript
if (!isValidEmail(form.email)) {
  errors.email = "Invalid email format";
}
```

The regex checks for the standard `user@domain.tld` pattern.

### 4. API Integration

| Operation | Method | Endpoint              | Request Body                                       |
|-----------|--------|-----------------------|----------------------------------------------------|
| Create    | POST   | `/api/users`          | `{ name, email, password, role, status, portalAccess }` |
| Edit      | PUT    | `/api/users/:id`      | `{ name, email, role, status, portalAccess }` (no password) |

Password is only sent on create. On edit, the password field is hidden entirely.

### 5. Toast Notifications

A lightweight inline toast system (no external library):

- **Success toast** (green): shown for 3 seconds, auto-dismisses, then closes modal and refreshes list
- **Error toast** (red): shown for 3 seconds, stays visible for the user to read

```typescript
const [toast, setToast] = useState<Toast | null>(null);

useEffect(() => {
  if (!toast) return;
  const timer = setTimeout(() => setToast(null), 3000);
  return () => clearTimeout(timer);
}, [toast]);
```

### 6. Form Validation

Validation runs on submit, not on every keystroke. Per-field error messages appear inline below the invalid field:

```typescript
function validate(): boolean {
  const next: Record<string, string> = {};
  if (!form.name.trim()) next.name = "Name is required";
  if (!form.email.trim()) next.email = "Email is required";
  else if (!isValidEmail(form.email)) next.email = "Invalid email format";
  if (!isEdit && !form.password) next.password = "Password is required";
  else if (!isEdit && form.password.length < 6)
    next.password = "Password must be at least 6 characters";
  if (!form.portalAccess.length) next.portalAccess = "Select at least one portal";
  setErrors(next);
  return Object.keys(next).length === 0;
}
```

## UserList Integration

The `UserList.tsx` page was updated to:

1. **Replace** the `<Link to="/users/new">` with an inline `+ New User` button that opens the modal in create mode
2. **Replace** the `<Link to="/users/:id/edit">` with an inline `Edit` button that opens the modal in edit mode
3. **Add** `UserFormModal` at the bottom of the component, wired to open/close state and the `fetchUsers` callback for list refresh

```typescript
const [modalOpen, setModalOpen] = useState(false);
const [editingUser, setEditingUser] = useState<User | null>(null);

<UserFormModal
  open={modalOpen}
  onClose={closeModal}
  editUser={editingUser ? { ...editingUser, portalAccess: editingUser.portalAccess ?? [] } : null}
  onSave={fetchUsers}
/>
```

## Styling Approach

All styles use inline `React.CSSProperties` objects, consistent with the existing codebase conventions. No CSS-in-JS library or Tailwind is used.

### Modal Structure

```
┌──────────────────────────────────────┐
│  Header: "Create User" / "Edit User" │  ← Title + close (×) button
├──────────────────────────────────────┤
│  Name          [________________]    │
│  Email         [________________]    │
│  Password      [________________]    │  ← Create only
│  Role          [Super Admin ▼]      │  ← Select dropdown
│  Portal Access                         │
│    ☑ Admin Portal                     │
│    ☐ Partner Portal                   │  ← Checkboxes
│    ☐ Customer Portal                  │
│  ☑ Active                             │  ← Toggle
├──────────────────────────────────────┤
│            [Cancel]  [Create/Update]  │  ← Footer with actions
└──────────────────────────────────────┘
```

## Data Flow

```
User clicks "+ New User" or "Edit"
         │
         ▼
Modal opens with form state initialized
  - create mode: empty fields, defaults
  - edit mode: pre-filled from user object
         │
         ▼
User fills/edits fields, clicks submit
         │
         ▼
validate() runs
  ├─ Fail → inline error messages shown, no API call
  └─ Pass → fetch() to POST/PUT /api/users
              │
              ├─ Success → toast "created/updated", 800ms delay,
              │            onSave() → list refreshes, modal closes
              └─ Error → toast with error message
```

## Testing

To test the modal:

1. Start the server and admin portal:
   ```bash
   cd /tmp/invt_management_system_repo
   npm run dev
   ```

2. Open http://localhost:3001/users

3. **Create a user**: Click "+ New User" → fill form → submit
4. **Edit a user**: Click "Edit" on any row → modify fields → submit
5. **Validation**: Try submitting with invalid email / empty password / no portal access
6. **Cancel**: Click Cancel or the overlay backdrop to dismiss

## Files Changed

| File | Change |
|------|--------|
| `src/admin-portal/src/pages/Users/UserFormModal.tsx` | **New** — 245-line modal component |
| `src/admin-portal/src/pages/Users/UserList.tsx` | Updated — replaced links with modal buttons |
| `src/admin-portal/src/pages/Users/index.ts` | Updated — added UserFormModal export |
| `src/admin-portal/src/App.tsx` | Updated — removed `/users/new` and `/users/:id/edit` routes |

## Dependencies

- `@moc/shared` — `Role`, `PortalType` enums, `isValidEmail` validator
- React 18 — `useState`, `useEffect`, `FormEvent`
- Native `fetch` API — no external HTTP client
