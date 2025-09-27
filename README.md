# ChronoFlow: Project Time Tracking

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kvoosterhout/generated-app-20250927-215931)

ChronoFlow is a minimalist and visually stunning time writing application designed for freelancers and small teams. It allows users to meticulously track time spent on various projects. Each project can be associated with a customer, streamlining client management. A key feature is the ability to flag time entries as 'invoiceable' or eligible for 'innovation subsidies (WBSO)', making financial administration and reporting seamless. The application will feature a central dashboard for quick time entry and weekly overviews, dedicated sections for managing customers and projects, and a simple yet powerful reporting tool to filter and export time logs.

## Key Features

- **Intuitive Time Tracking**: Log hours against projects with ease.
- **Project & Customer Management**: Full CRUD functionality for projects and their associated customers.
- **Financial Tagging**: Mark entries as `invoiceable` or `WBSO` for streamlined reporting.
- **Insightful Dashboard**: A central hub for quick entries and weekly summaries.
- **Powerful Reporting**: Filter and export your time logs by date, customer, project, and more.
- **Minimalist Design**: A clean, modern, and visually stunning interface built for focus and efficiency.

## Technology Stack

- **Frontend**:
  - [React](https://react.dev/)
  - [Vite](https://vitejs.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
  - [Zustand](https://zustand-demo.pmnd.rs/) for state management
  - [React Router](https://reactrouter.com/) for navigation
  - [Framer Motion](https://www.framer.com/motion/) for animations
- **Backend**:
  - [Cloudflare Workers](https://workers.cloudflare.com/)
  - [Hono](https://hono.dev/) Web Framework
  - [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) for stateful storage

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- A [Cloudflare account](https://dash.cloudflare.com/sign-up).
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated: `bunx wrangler login`.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/chronoflow.git
    cd chronoflow
    ```

2.  **Install dependencies:**
    ```sh
    bun install
    ```

### Running Locally

To start the development server for both the frontend and the local Cloudflare Worker, run:

```sh
bun dev
```

This will start the Vite development server (typically on `http://localhost:3000`) and a local instance of the Worker for the API. The application will be accessible in your browser.

## Project Structure

- `src/`: Contains the frontend React application source code.
  - `pages/`: Top-level page components for each view.
  - `components/`: Reusable React components, including shadcn/ui elements.
  - `lib/`: Utility functions and API client.
- `worker/`: Contains the backend Cloudflare Worker source code.
  - `index.ts`: The main entry point for the worker.
  - `user-routes.ts`: Defines the Hono API routes.
  - `entities.ts`: Defines the data models and logic for interacting with Durable Objects.
- `shared/`: Contains TypeScript types shared between the frontend and backend.

## Available Scripts

- `bun dev`: Starts the local development server.
- `bun build`: Builds the frontend application and worker for production.
- `bun lint`: Runs the linter to check for code quality issues.
- `bun deploy`: Deploys the application to your Cloudflare account.

## Deployment

This project is configured for seamless deployment to Cloudflare Pages.

1.  **Build the project:**
    ```sh
    bun build
    ```

2.  **Deploy using Wrangler:**
    Make sure you are logged in with `bunx wrangler login`. Then, run the deploy command:
    ```sh
    bun deploy
    ```

Wrangler will handle the process of uploading your static assets and the worker function to Cloudflare.

Alternatively, deploy with a single click:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/kvoosterhout/generated-app-20250927-215931)

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.