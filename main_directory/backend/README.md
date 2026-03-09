# MF BACKEND — MACHARIA'S FARMHOUSE

This minimal backend serves the frontend files in `public/` and exposes an admin API endpoint compatible with TanStack Query on the frontend. It includes session-based authentication and a simple admin portal.

Quick start:

1. Install dependencies:

```powershell
npm install
```

2. Run server:

```powershell
npm start
```

Open http://localhost:3000 to view the frontend home page and http://localhost:3000/admin for the admin panel.

### Authentication

The admin panel (`/admin`) is protected by session-based authentication. Default credentials:

- **Username**: `admin`
- **Password**: `password`

Set custom credentials via environment variables:

```powershell
$env:ADMIN_USER = "myuser"
$env:ADMIN_PASS = "mypass"
npm start
```

**For production:** Replace the plaintext auth with bcrypt password hashing, a real database, and a persistent session store (e.g., Redis or PostgreSQL).

### Routes

- `GET /` — Frontend home page
- `GET /admin/login` — Admin login form
- `GET /admin` — Admin dashboard (protected)
- `POST /admin/login` — Login handler
- `GET /admin/logout` — Logout handler
- `GET /api/admin` — Admin API endpoint (TanStack Query compatible)
