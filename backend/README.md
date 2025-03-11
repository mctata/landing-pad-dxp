# Landing Pad DXP - Backend

This is the backend service for the Landing Pad Digital Experience Platform, providing API endpoints for the frontend application.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- npm or yarn

### Environment Setup

1. Clone the repository
2. Navigate to the backend directory
3. Copy the environment variables example file:
   ```
   cp .env.example .env
   ```
4. Update the .env file with your configuration

### Database Setup

Before running the application, you need to set up the PostgreSQL database:

1. Create a PostgreSQL database:
   ```
   createdb landing_pad_dev
   ```

   (If you're using a GUI like pgAdmin, create a new database named "landing_pad_dev")

2. Initialize the database with tables and seed data:
   ```
   npm run db:init
   ```

   This will:
   - Create all the necessary tables
   - Seed default templates
   - Create demo users (in development mode)

3. If you need to reset the database (WARNING: this will delete all data):
   ```
   npm run db:reset
   ```

### Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. The server will be available at http://localhost:3001
   - Health check: http://localhost:3001/health
   - API base URL: http://localhost:3001/api

### Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with hot reload
- `npm run db:init` - Initialize the database with tables and seed data
- `npm run db:reset` - Reset the database (drop all tables) and reseed
- `npm run seed` - Run database seeds without dropping tables
- `npm test` - Run tests
- `npm run lint` - Run linting

## API Documentation

API documentation is available at `/docs/api-reference.md` in the root of the project.

## Database Models

The application uses Sequelize ORM with the following models:

- User - User accounts and authentication
- Project - User projects and websites
- Template - Website templates

## Authentication

Authentication is handled using JWT tokens. To authenticate:

1. Call the login endpoint with valid credentials
2. Use the returned token in the Authorization header for subsequent requests

## Contributing

Please read the CONTRIBUTING.md file for details on our code of conduct and the process for submitting pull requests.