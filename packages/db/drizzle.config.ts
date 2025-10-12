import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  driver: 'aws-data-api',
  dbCredentials: {
    database: process.env.DATABASE_NAME!,
    resourceArn: process.env.DATABASE_CLUSTER_ARN!,
    secretArn: process.env.DATABASE_SECRET_ARN!,
  },
} satisfies Config;
