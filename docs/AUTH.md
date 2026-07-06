# Authentication & Authorization

## Overview

The IMS uses JWT-based authentication with role-based access control. Users authenticate once and receive a token that grants access to one or more portals.

## Auth Flow

### Registration

1. User navigates to `/register` (user portal) or `/admin/register` (admin portal)
2. Fills in name, email, password, confirm password
3. `POST /api/auth/register` creates the account with default `viewer` role
4. On success, user is redirected to the login page

### Login

1. User navigates to `/login` (user portal) or `/admin/login` (admin portal)
2. Submits email + password
3. `POST /api/auth/login` validates credentials and returns a JWT token + user object
4. Token and user data are persisted to `localStorage` (`ims_auth_token`, `ims_auth_user`)
5. Auth state is set in `AuthContext`; the app rerenders as authenticated

### Post-Login Redirect

- If the user has `portalAccess` with **multiple entries** (e.g., `["admin", "user"]`), they are redirected to `/portal-select` to choose a portal
- If the user has access to **only one portal**, they are sent directly to that portal's dashboard

### Token Validation

1. On app load, `AuthContext` checks `localStorage` for an existing token
2. If found, `GET /api/auth/me` validates the token with the backend
3. If valid, the session is restored; if expired/invalid, the stored token is cleared
4. Users are redirected to login when the token is missing or invalid

### Logout

1. `logout()` in `AuthContext` clears `localStorage` entries
2. Auth state is reset; the app redirects to the login page

## API Endpoints

| Method | Endpoint             | Auth Required | Description                |
|--------|----------------------|---------------|----------------------------|
| POST   | `/api/auth/login`    | No            | Authenticate and get token |
| POST   | `/api/auth/register` | No            | Create a new account       |
| GET    | `/api/auth/me`       | Yes (Bearer)  | Get current user profile   |

## Route Protection

### Shared Components

- **`ProtectedRoute`** — wraps routes that require authentication. Redirects to the login page if the user is not authenticated
- **`AuthProvider`** — wraps the entire app to provide auth context to all components
- **`useAuth`** — hook to access auth state and login/logout functions

### Portal-Specific Routes

| Portal       | Login             | Register               | Portal Select               | Protected Routes        |
|-------------|-------------------|------------------------|-----------------------------|-------------------------|
| User Portal | `/login`          | `/register`            | `/portal-select`            | `/`, `/products`, ...   |
| Admin Portal| `/admin/login`    | `/admin/register`      | `/admin/portal-select`      | `/`, `/users`, ...      |

## Portal Selection

When a user has access to multiple portals (e.g., admin with both admin and user portal access), they see the portal selection page after login:

- **Admin Portal** card — navigates to the admin dashboard
- **User Portal** card — navigates to the user portal

Each card is shown only if the user's `portalAccess` includes that portal. If `portalAccess` is empty, all portals are shown.

## User Type

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  tenantId?: string;
  portalAccess?: string[];   // e.g., ["admin", "user"]
  createdAt: string;
  updatedAt: string;
}
```

`portalAccess` is an array of portal identifiers from the database. The backend stores this as a PostgreSQL array column (`portal_access text[]`).

## Role-to-Portal Mapping (Seed Data)

| Role         | Portal Access         |
|-------------|-----------------------|
| super_admin | `["admin", "user"]`   |
| admin       | `["admin", "user"]`   |
| manager     | `["user"]`            |
| viewer      | `["user"]`            |

Users created through the registration form default to `viewer` role with access to the user portal only.
