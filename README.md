# Employee Task Tracker — Backend (Docker)

This repository contains the backend API for the Employee Task Tracker assessment. It is an Express + Prisma application packaged with Docker for easy evaluation.

**Quick start (Docker)**

Prerequisites: Docker and Docker Compose installed.

make .env file before the initializing this docker command

PORT=3000
NODE_ENV=development
APP_NAME=employee-task-tracker
APP_URL=http://localhost:3000
SMTP_USER=c677abb08301d3
SMTP_PASS=62134ac3253e24
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
FROM_EMAIL=hello@demomailtrap.co
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001,http://localhost:5174

# Database
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YourStrongPassw0rd
DB_NAME=employee_tracker
DATABASE_URL=mysql://root:YourStrongPassw0rd@db:3306/employee_tracker


# JWT
JWT_SECRET=super_secret_jwt_key_change_in_production_32c
JWT_EXPIRES_IN=7d

```bash
docker compose up --build
```

The API will be available at http://localhost:3000 (see `.env` for `PORT`).

To stop and remove volumes:

```bash
docker compose down -v
```

Default seeded accounts (see `prisma/seed.js`):
- admin@example.com / Admin@123
- john@example.com  / Employee@123
- jane@example.com  / Employee@123

**Environment**
- Required: `DATABASE_URL`, `JWT_SECRET`
- Optional: `PORT`, `APP_NAME`, `NODE_ENV`, `CORS_ORIGIN`, `JWT_EXPIRES_IN`

**Project structure (important files)**
- `src/app.js` — application entry, middleware and route mounting
- `src/routes/*` — route definitions (mounted at `/api`)
- `src/controllers/*` — controllers implementing endpoint logic
- `src/services/*` — business logic and DB access (Prisma)
- `src/validators/*` — request validation rules
- `prisma/schema.prisma` — database schema and migrations

**Full project tree**
```text
docker-compose.yml
docker-entrypoint.sh
Dockerfile
package.json
postman_collection.json
README.md
prisma/
	schema.prisma
	seed.js
	migrations/
		migration_lock.toml
		20260528102405_init/
			migration.sql
		20260531155902_/
			migration.sql
src/
	app.js
	config/
		prisma.js
	controllers/
			activityLogController.js
			authController.js
			taskController.js
			userController.js
	middleware/
		authenticate.js
		authorize.js
		errorHandler.js
	routes/
		activityLogRoutes.js
		authRoutes.js
		index.js
		taskRoutes.js
		userRoutes.js
	services/
		activityLogService.js
		authService.js
		taskService.js
		userService.js
	utils/
		email.js
	validators/
		authValidator.js
		taskValidator.js
```

**API Overview**
Base URL: `{{baseUrl}}` where `{{baseUrl}}` defaults to `http://localhost:3000/api`.

Authentication: JWT Bearer token required for protected endpoints. Obtain a token using `POST /api/auth/login` and set `Authorization: Bearer <token>`.

Routes and summary:

- **Health**
	- GET `/api/health` — basic health information

- **Auth** (`/api/auth`)
	- POST `/register` — create a user
		- Body: `{ name, email, password, role? }`
	- POST `/login` — login and receive a token
		- Body: `{ email, password }`
	- POST `/forgot-password` — request password reset
		- Body: `{ email }` (always returns generic message)
	- POST `/reset-password` — reset password with token
		- Body: `{ token, password }`
	- GET `/profile` — get current user profile (requires auth)

- **Users** (`/api/users`)
	- GET `/` — admin only, paginated users list (`?page=&limit=`)
	- GET `/:id/tasks` — get tasks for a user (admin or the user)
		- Query filters: `status`, `dueDate`, `page`, `limit`

- **Tasks** (`/api/tasks`)
	- POST `/` — create task (admin only)
		- Body: `{ title, description?, assigned_to, status?, due_date? }`
	- GET `/` — list tasks (admins see all; employees see own)
		- Query filters: `status`, `dueDate`, `assignedTo`, `page`, `limit`
	- GET `/:id` — get task by id (auth; employees restricted to own tasks)
	- PUT `/:id` — update task (admins update all fields; employees may update `status` only)

- **Activity Logs** (`/api/activity-logs`)
	- GET `/` — admin only, returns paginated logs
		- Query filters: `userId`, `taskId`, `page`, `limit`

**Validators / Request shapes**
- Registration: `name` (string, required), `email` (email, required), `password` (min 6 chars), `role` (optional, `admin|employee`)
- Login: `email`, `password` (required)
- Create Task: `title` (required), `assigned_to` (user id, required), `status` (optional: `pending|in_progress|completed`), `due_date` (ISO 8601)
- Update Task: same fields optional; employees may only send `status`

**Postman collection**
A Postman collection that contains every API call is included at: [postman_collection.json](postman_collection.json).

Import it into Postman and set the collection variables:
- `baseUrl` — e.g. `http://localhost:3000/api`
- `token` — JWT token (set after login)

Optional: After running `POST /api/auth/login`, copy `data.token` from the response and set it to the `token` collection variable so protected requests work.

If you want me to also commit these files to git, run tests, or add example curl commands, tell me which you'd like next.
