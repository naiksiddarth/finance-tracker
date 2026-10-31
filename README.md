# Finance Tracker

Finance Tracker is a full-stack personal finance application for managing transactions and viewing financial metrics. The repository is an npm-workspaces monorepo managed with Turborepo.

## Features

- User registration and authentication
- Transaction management
- Dashboard metrics and date-range filtering
- Shared validation, database models, and UI components
- REST API with Postman collections for manual testing

## Tech Stack

- **Web:** React 19, Vite, Tailwind CSS v4, React Router, Recharts
- **API:** Express 5, Mongoose, MongoDB
- **Shared packages:** TypeScript, Zod, shared enums, database models, and shadcn/ui components
- **Tooling:** npm workspaces, Turborepo, Vitest, ESLint, and Prettier

## Repository Structure

```text
apps/web/          React frontend
apps/api/          Express API
packages/db/       Mongoose models
packages/shared/   Shared enums and types
packages/ui/       Shared UI components and styles
packages/validation Shared Zod validation schemas
postman/           API collections, environments, and flows
```

## Prerequisites

- Node.js 20 or newer
- npm 11 or newer
- A running MongoDB instance or MongoDB Atlas database

## Getting Started

Install dependencies from the repository root:

```bash
npm install
```

Create the API environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

Update `apps/api/.env` with values for your MongoDB connection and token secrets:

```env
MONGODB_URI=mongodb://<user>:<password>@<host>:27017/finance-tracker
PORT=3131
ACCESS_TOKEN_SECRET=<access_token_secret>
REFRESH_TOKEN_SECRET=<refresh_token_secret>
ARTIFICIAL_DELAY=false
```

Do not commit `.env` files or real secrets.

## Development

Start the frontend and API together from the repository root:

```bash
npm run dev
```

The Vite frontend is available at `http://localhost:5173` and the API listens on `http://localhost:3131`.

To run one application independently:

```bash
npx turbo dev --filter web
npx turbo dev --filter api
```

## Validation and Tests

Run the repository-wide checks:

```bash
npm run build
npm run lint
npm run typecheck
npm run format
```

Run application tests directly:

```bash
npx turbo test --filter web
npx turbo test --filter api
```

The API tests use an in-memory MongoDB instance where appropriate. Integration tests that require a database may need the API environment configured first.

## API Documentation

Postman resources are available under [`postman/`](postman/), including the Finance Tracker API collection and environment configuration. The API is organized around authentication, users, transactions, and metrics.


## License

This project is distributed under the [MIT License](LICENSE).
