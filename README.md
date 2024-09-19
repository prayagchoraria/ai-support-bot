# AI Chat Bot Project

This is a Next.js project for an AI support bot application.

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm, or pnpm (package managers)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/prayagchoraria/ai-support-bot.git
   cd ai-support-bot
   ```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the chat bot.

## Code Structure

- **src/**: Contains the main application code.
  - **lib/**: Utility functions and services.
    - `ai-service-singleton.ts`: Implements the singleton pattern for the AI service.
  - **services/**: Business logic and service layer.
    - **ai-service/**: Contains the AI service logic.
      - `ai-service.ts`: Main AI service functionalities.
    - `knowledge-base-service/`: Manages interactions with the knowledge base.
      - `knowledge-base-service.ts`: Logic for fetching and processing knowledge base data.
  - **app/api/**: API routes for handling requests.
    - `chat/route.ts`: API route for chat interactions.
  - **components/**: React components for the UI.
    - `ai-chat/`: Contains the AI chat component and related types.

## Dependencies

- **Next.js**: Framework for server-rendered React applications.
- **TypeScript**: For type safety and better development experience.
- **TailwindCSS**: For styling the application.

## Specific Requirements

- Ensure you have the necessary environment variables in `.env` file set up for the AI service and knowledge base interactions.
- Review the `app-config.ts` file for configurable settings like app title and prompts.

## Accessing Functionality

Once the server is running, you can interact with the AI chat bot through the UI. The bot processes user input and responds based on the configured knowledge base and AI service logic.

For further development, refer to the [DESIGN_DOCUMENT.md](./DESIGN_DOCUMENT.md) for architectural decisions and guidelines.
