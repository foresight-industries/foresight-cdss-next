# Foresight CDSS Next

A modern RCM automation system built with Next.js and Turborepo for healthcare prior authorization & claim management.

## 🏗️ Architecture

This is a monorepo managed by [Turborepo](https://turbo.build) containing:

### Apps
- **`apps/web`** - Next.js 15 application with React 19, Clerk authentication, and team-based routing
- **`apps/web-e2e`** - Cypress end-to-end testing suite

### Packages
- **`packages/db`** - Drizzle ORM database schema and utilities for PostgreSQL
- **`packages/webhooks`** - Shared webhook schemas and utilities
- **`packages/functions/*`** - AWS Lambda functions for various services:
  - `api` - API endpoints
  - `batch-job` - Batch processing jobs
  - `bulk-processor` - Bulk data processing
  - `document-processor` - Document processing pipeline
  - `workers` - Background worker functions

### Infrastructure
- **`infra/`** - AWS CDK infrastructure as code

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- Yarn package manager
- PostgreSQL database
- AWS credentials (for deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd foresight-cdss-next

# Install dependencies
yarn install

# Build all packages
yarn build
```

### Development

```bash
# Start development server for web app
yarn dev

# Run specific app
yarn turbo dev --filter=@foresight-cdss-next/web

# Run all tests
yarn test

# Run type checking
yarn check-types

# Run linting
yarn lint
```

## 📦 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling with design system
- **Radix UI** - Accessible component primitives
- **Clerk** - Authentication and user management
- **Tanstack Query** - Server state management
- **Zustand** - Client state management

### Backend
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database
- **AWS Lambda** - Serverless functions
- **AWS CDK** - Infrastructure as code
- **Redis** - Caching layer

### Development Tools
- **Turborepo** - Monorepo build system
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Unit testing
- **Cypress** - E2E testing
- **Sentry** - Error monitoring

## 🏃‍♂️ Available Scripts

### Root Level Commands
```bash
yarn build          # Build all packages and apps
yarn dev            # Start development servers
yarn test           # Run all tests
yarn lint           # Lint all packages
yarn format         # Format code with Prettier
yarn clean          # Clean all build artifacts
yarn check-types    # Run TypeScript type checking
```

### Database Commands
```bash
yarn db:generate    # Generate database schema
yarn db:push        # Push schema to database
yarn db:migrate     # Run database migrations
yarn db:studio      # Open Drizzle Studio
yarn db:reset       # Reset database (development only)
```

### Package-Specific Commands
```bash
# Run commands for specific packages
yarn turbo build --filter=@foresight-cdss-next/web
yarn turbo test --filter=@foresight-cdss-next/db
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` files in the appropriate packages:

```bash
# Required for web app
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Database Setup
1. Set up PostgreSQL database
2. Configure `DATABASE_URL` in environment variables
3. Run migrations: `yarn db:migrate`
4. Seed data: `yarn db:seed`

## 📁 Project Structure

```
foresight-cdss-next/
├── apps/
│   ├── web/                    # Next.js application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   ├── components/    # Reusable components
│   │   │   ├── lib/          # Utilities and configurations
│   │   │   └── proxy.ts  # Next.js middleware
│   │   └── package.json
│   └── web-e2e/              # Cypress E2E tests
├── packages/
│   ├── db/                   # Database schema and utilities
│   ├── webhooks/            # Webhook schemas
│   └── functions/           # Lambda functions
├── infra/                   # AWS CDK infrastructure
├── turbo.json              # Turborepo configuration
└── package.json           # Root workspace configuration
```

## 🚦 CI/CD

The project uses Turborepo for efficient builds and caching:

- **Build Pipeline**: Builds are optimized with dependency graphs
- **Caching**: Remote caching for faster builds
- **Type Safety**: All packages are type-checked
- **Testing**: Unit and E2E tests run in parallel
- **Linting**: Code quality enforced across all packages

## 🔒 Security

- **Authentication**: Clerk handles user authentication and session management
- **Authorization**: Team-based access control with middleware
- **Database**: Parameterized queries prevent SQL injection
- **Environment**: Secrets managed through environment variables
- **Monitoring**: Sentry integration for error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and add tests
4. Run tests: `yarn test`
5. Run type checking: `yarn check-types`
6. Run linting: `yarn lint`
7. Commit changes: `git commit -m 'Add your feature'`
8. Push to branch: `git push origin feature/your-feature`
9. Create a Pull Request

## 📝 License

This project is proprietary and confidential.

## 🆘 Support

For support and questions:
- Check the documentation in each package's README
- Review the codebase structure and comments
- Contact the development team

---

Built with ❤️ using Turborepo, Next.js, and modern web technologies.
