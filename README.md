# Nexora AI

Nexora is an autonomous multi-agent goal execution platform. It turns a high-level goal into an actionable workflow, coordinates specialized agents, uses personal knowledge, and tracks execution through a unified dashboard.

## What It Includes

- Authentication and user profiles
- Goal creation, goal analysis, and plan generation
- DAG-style workflow planning and execution
- Agent registry with research, strategy, career, and startup agents
- Career workspace with job matching, company research, interview practice, and application tracking
- Startup workspace with customer personas, competitor matrices, business models, and MVP roadmaps
- Knowledge hub for document ingestion, retrieval, and memory context
- Human approval flows for proposed actions
- Analytics, notifications, and an in-app AI assistant
- React dashboard with a Vite development server and API proxy

## Architecture

```text
frontend/  React + TypeScript + Vite + Tailwind CSS
backend/   Express + TypeScript + MongoDB/Mongoose
           |
           +-- auth and profile APIs
           +-- goal and workflow orchestrator
           +-- agent and tool registries
           +-- career and startup services
           +-- knowledge and memory APIs
           +-- approvals, analytics, notifications, assistant
```

The frontend runs on port `3000` and proxies `/api` requests to the backend on port `5000`.

## Requirements

- Node.js 18 or newer
- npm
- MongoDB running locally, or a reachable MongoDB deployment
- At least one browser-supported development environment

An LLM provider key is optional for local startup. Add a Gemini or OpenAI key when you want provider-backed agent responses; the backend includes a semantic fallback for development without a key. Anthropic credentials are supported in user profile storage but are not currently used by the server LLM adapter.

## Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/arpitsaxena2004/Nexora.git
cd Nexora

cd backend
npm install
copy .env.example .env  # Windows PowerShell: Copy-Item .env.example .env

cd ../frontend
npm install
```

Configure `backend/.env` as needed. The defaults are suitable for a local MongoDB instance:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/nexora
JWT_SECRET=replace-this-for-any-shared-environment
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

Start the backend and frontend in separate terminals:

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Verify the backend with [http://localhost:5000/api/health](http://localhost:5000/api/health).

## Available Scripts

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000 |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build locally |

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the TypeScript API with automatic restart |
| `npm run typecheck` | Run the backend TypeScript checker |
| `npm run build` | Compile the backend to `dist/` |
| `npm start` | Run the compiled backend |

## API Areas

The Express API is mounted under `/api` and currently includes:

- `/auth` and `/profile`
- `/goals` and `/workflows`
- `/agents` and `/tools`
- `/career` and `/startup`
- `/knowledge`
- `/approvals`
- `/analytics` and `/notifications`
- `/assistant`
- `/health`

Authenticated requests use the JWT returned by registration or login. The frontend stores that token locally and adds it to API requests automatically.

## Project Layout

```text
Nexora/
├── backend/
│   ├── src/
│   │   ├── agents/          Agent implementations and registry
│   │   ├── config/          Environment and database configuration
│   │   ├── middleware/      Authentication and validation middleware
│   │   ├── models/          Mongoose models
│   │   ├── orchestrator/    Workflow planning and execution
│   │   ├── rag/             Document ingestion and retrieval
│   │   ├── routes/          REST API routes
│   │   ├── services/        LLM, career, email, and domain services
│   │   └── server.ts        Express application bootstrap
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/      Shared dashboard components
│       ├── context/         Authentication and application context
│       ├── pages/           Product workspaces and views
│       └── services/        API client and endpoint helpers
└── flow.txt                 Product workflow and domain notes
```

## Troubleshooting

- If the backend repeatedly logs MongoDB connection warnings, start MongoDB or update `MONGODB_URI`.
- If API calls fail from the frontend, confirm the backend is listening on port `5000`; Vite proxies `/api` there.
- If provider-backed responses are unavailable, check the selected API key in `backend/.env`. The app can still start without one.
- Do not commit `.env` files, API keys, JWT secrets, or SMTP credentials.

## License

No license has been declared in this repository yet.