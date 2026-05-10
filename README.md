# DMNex Modeller (Frontend)

Web client for DMNex Modeller built with React, TypeScript, Vite, Material UI, and axios.

This application lets you manage workspaces and author DMN models in a browser-based flow.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Material UI 9
- React Router 7
- axios
- DMN editor: `@kie-tools/dmn-editor-standalone`

## Features

- Workspace management
  - Create workspace
  - List/search/sort/paginate workspaces
  - Update and delete workspace
- DMN flow per workspace
  - List DMN files in a workspace
  - Create a new DMN model
  - Rename/edit DMN model
- Integration with backend REST APIs under `/api/v1/workspaces`

## Repository Structure

```text
src/
  api/                # axios client and API methods
  components/         # shell and reusable UI components
  features/workspace/ # workspace state and context/store logic
  pages/              # routed pages
```

## Prerequisites

- Node.js 22+
- pnpm 10+
- Java 25 (for backend service)
- Docker (optional, for local PostgreSQL)

## Local Setup

1. Install frontend dependencies:

```bash
pnpm install
```

2. Start backend dependencies (from `dmnex-modeller-service`):

```bash
docker compose up -d
```

3. Start backend service (from `dmnex-modeller-service`):

```bash
./gradlew bootRun
```

On Windows PowerShell:

```powershell
.\gradlew.bat bootRun
```

4. Start frontend dev server (from this folder):

```bash
pnpm dev
```

Frontend default URL: `http://localhost:5173`

Backend default URL: `http://localhost:8080`

Swagger UI: `http://localhost:8080/swagger-ui.html`

OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Environment Variables

The frontend API base URL can be overridden with Vite env var:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

If not set, the app defaults to `http://localhost:8080`.

Create a `.env.local` file in this folder for local overrides.

## Available Scripts

- `pnpm dev` - start Vite dev server
- `pnpm build` - type-check and create production build
- `pnpm preview` - preview production build locally
- `pnpm lint` - run ESLint

## Backend Notes

The paired backend project is `dmnex-modeller-service` and currently uses:

- Spring Boot 4
- Spring Web MVC + Validation
- Spring Data JPA
- Liquibase
- PostgreSQL
- springdoc OpenAPI UI
- Lombok + MapStruct

Default DB configuration in backend:

- DB URL: `jdbc:postgresql://localhost:5432/dmnex-modeller-db`
- Username: `postgres`
- Password: `postgres`

## API Endpoints Used by Frontend

Base path: `/api/v1/workspaces`

- `GET /api/v1/workspaces`
- `GET /api/v1/workspaces/{id}`
- `POST /api/v1/workspaces`
- `PUT /api/v1/workspaces/{id}`
- `DELETE /api/v1/workspaces/{id}`

## Troubleshooting

- Frontend cannot reach backend
  - Verify backend is running on `http://localhost:8080`
  - Check `VITE_API_BASE_URL`
- Database connection fails in backend
  - Ensure PostgreSQL container is up: `docker compose ps`
  - Confirm credentials in `application.yaml`
- Port conflict
  - Change Vite port or stop conflicting process

## Roadmap Ideas

- Persist DMN artifacts to backend storage
- Add authentication and workspace ownership
- Add unit/integration tests for frontend API layer and pages
