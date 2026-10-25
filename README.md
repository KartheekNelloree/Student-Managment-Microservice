# Student Management System

A small full-stack student and course manager built with React, FastAPI microservices, SQLAlchemy and SQLite. The React app talks only to the API gateway. Auth, student records, courses and enrollments are stored by separate services.

## Architecture

```text
React + Vite (5173)
        |
        v
API Gateway (8000) --HTTPX--> Auth Service (8001) --> auth.db
                    --HTTPX--> Student Service (8002) --> students.db
                    --HTTPX--> Course Service (8003) --> courses.db
```

- **Auth service** registers accounts, hashes passwords with Argon2, issues signed JWTs and validates `/auth/me`.
- **Student service** owns student records. Its `course_id` is only a numeric reference; it is not a cross-database foreign key. Student forms load available courses from the course service and keep this reference aligned with the local enrollment.
- **Course service** owns courses and enrollment rows. Enrollments keep student IDs locally; the service does not contact the student service, and operations across services are not atomic.
- **API gateway** routes `/auth/*`, `/students*` and `/courses*` to their respective service, forwarding request data and authorization headers with bounded timeouts and safe upstream errors.
- **Frontend** includes administrator registration/login, a protected overview, searchable student directory and course catalog with add/edit/delete forms. When adding or editing a student, administrators can choose an available course; the student record and course service's local enrollment are updated together as best-effort cross-service operations.

Student and course records are scoped to the user ID in the verified JWT. The three backend services must use the same JWT secret and algorithm.

The current development account has a starter course catalog for CS (Computer Science), ECE (Electronics & Communication), EEE (Electrical & Electronics), ME (Mechanical Engineering), and CE (Civil Engineering). When adding or editing a student, choose one of these catalog entries to save the student's course reference and create a local enrollment record. New accounts can create their own courses from the Courses page.

## Project structure

```text
api-gateway/                 FastAPI + HTTPX gateway
auth-service/app/            Auth API, ORM, schemas, JWT/password utilities
student-service/app/         Student CRUD API and isolated SQLite database
course-service/app/          Course CRUD and local enrollment API/database
frontend/src/components/     Navigation, route guard and toast
frontend/src/context/         Authentication context
frontend/src/pages/           Login, registration, dashboard and CRUD pages
frontend/src/services/        Gateway-only frontend API client
postman/collection.json       Postman v2.1 request collection
```

## Prerequisites

- Python 3.10 or newer
- Node.js 20.19 or newer and npm
- PowerShell on Windows
- Postman (optional, for the included collection)

## Windows PowerShell setup

Open PowerShell in the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r auth-service\requirements.txt
python -m pip install -r student-service\requirements.txt
python -m pip install -r course-service\requirements.txt
python -m pip install -r api-gateway\requirements.txt
```

If script activation is disabled, use the venv executables directly, for example `.venv\Scripts\python.exe -m pip install -r auth-service\requirements.txt`.

Copy each example file to `.env` in the same service folder. Use a newly generated secret in **all three** backend service files:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
Copy-Item auth-service\.env.example auth-service\.env
Copy-Item student-service\.env.example student-service\.env
Copy-Item course-service\.env.example course-service\.env
Copy-Item api-gateway\.env.example api-gateway\.env
Copy-Item frontend\.env.example frontend\.env
```

Replace each backend's `JWT_SECRET_KEY` placeholder with the same generated value. Keep the services' `DATABASE_URL` values separate. The placeholders in `.env.example` are not usable secrets; never commit real `.env` files.

### Start the backend services

For everyday use, start all five servers and open the website with one command from the project root:

```powershell
.\start.ps1
```

The launcher reuses services that are already running and opens separate PowerShell windows for any it starts. Leave those windows open while using CampusDesk; close them when finished. If Windows blocks the script, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that PowerShell window, then run `.\start.ps1` again. This changes policy only for that window.

To start services individually instead, use the commands below.

Run each command in a separate PowerShell terminal from the named directory. Activate the project-root environment in each terminal first:

```powershell
.\.venv\Scripts\Activate.ps1
Set-Location auth-service
python -m uvicorn app.main:app --reload --port 8001
```

```powershell
.\.venv\Scripts\Activate.ps1
Set-Location student-service
python -m uvicorn app.main:app --reload --port 8002
```

```powershell
.\.venv\Scripts\Activate.ps1
Set-Location course-service
python -m uvicorn app.main:app --reload --port 8003
```

```powershell
.\.venv\Scripts\Activate.ps1
Set-Location api-gateway
python -m uvicorn main:app --reload --port 8000
```

### Start the frontend

In another terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Visit **http://localhost:5173**. The frontend reads the gateway URL from `VITE_API_BASE_URL`.

## Environment variables

| File | Variable | Purpose |
| --- | --- | --- |
| `frontend/.env` | `VITE_API_BASE_URL` | Browser-facing gateway URL |
| `api-gateway/.env` | `AUTH_SERVICE_URL`, `STUDENT_SERVICE_URL`, `COURSE_SERVICE_URL` | Internal upstream service URLs |
| `api-gateway/.env` | `FRONTEND_ORIGIN` | Allowed browser origin |
| Each service `.env` | `JWT_SECRET_KEY` | Shared signing key; use a strong random value |
| Each service `.env` | `JWT_ALGORITHM` | JWT signing algorithm (default `HS256`) |
| `auth-service/.env` | `ACCESS_TOKEN_EXPIRE_MINUTES` | Login token lifetime |
| Each service `.env` | `DATABASE_URL` | That service's own SQLite URL |
| Each service `.env` | `FRONTEND_ORIGIN` | Allowed browser origin for direct API docs/testing |

## API and Swagger

- Frontend: http://localhost:5173
- Gateway health: http://127.0.0.1:8000/health
- Gateway Swagger: http://127.0.0.1:8000/docs
- Auth Swagger: http://127.0.0.1:8001/docs
- Student Swagger: http://127.0.0.1:8002/docs
- Course Swagger: http://127.0.0.1:8003/docs

All service endpoints are under `/auth`, `/students` or `/courses`. Protected endpoints require `Authorization: Bearer <token>`. Course enrollment is `POST /courses/{course_id}/students/{student_id}`, removal is `DELETE /courses/{course_id}/students/{student_id}`, and listing is `GET /courses/{course_id}/students`.

## Tests and frontend build

From the project root, with the Python virtual environment active:

```powershell
python -m pytest auth-service\tests student-service\tests course-service\tests api-gateway\tests -q
```

The tests use temporary SQLite databases; they do not populate the development databases. To verify the frontend production bundle:

```powershell
Set-Location frontend
npm install
npm run build
```

## Postman

Import `postman/collection.json` into Postman. Set `base_url` to `http://127.0.0.1:8000`. Run **Register** once with a new email, then **Login**; its test script saves the JWT in the `token` collection variable used by protected requests. Create a student/course before running the update, delete and enrollment requests, then set the corresponding `student_id` and `course_id` variables.

## Token storage and security notes

The frontend stores the short-lived access token in `sessionStorage`, which clears when the tab session ends. Browser storage is still readable by JavaScript running on the page, so it is **not fully secure** against cross-site scripting. Production deployments should consider a backend-for-frontend or secure, `HttpOnly`, `Secure`, `SameSite` cookies, alongside appropriate CSRF and XSS protections.

Keep secrets only in local `.env` files or a deployment secret manager. Use HTTPS outside local development. Passwords are never returned by the API; authentication failures use safe messages. Student and course data are isolated by JWT user ID. Enrollment references are local records and are not a cross-service transaction.

## Troubleshooting

- **401 on protected requests:** Sign in again, check that all three services use the exact same `JWT_SECRET_KEY` and `JWT_ALGORITHM`, and verify the `Authorization` header.
- **502/504 from the gateway:** Check that the corresponding service is running on the URL configured in `api-gateway/.env`.
- **Browser CORS error:** Set `FRONTEND_ORIGIN` to the exact browser origin (normally `http://localhost:5173`) in the gateway and backend service `.env` files, then restart them.
- **Database setup:** SQLite files are created by each service on startup in its working directory. They are generated data and are ignored by Git.
- **Dependency/import errors:** Activate the root `.venv`, install the listed requirements, and run each Uvicorn command from its service directory.

The project is GitHub-ready, but no repository has been initialized and nothing has been pushed.
