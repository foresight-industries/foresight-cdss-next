import type { Config } from 'drizzle-kit';
import { config } from '@dotenvx/dotenvx';

config({
  path: '.env.local',
});

if (!process.env.DATABASE_NAME) {
  throw new Error('DATABASE_NAME is not defined');
}

if (!process.env.DATABASE_CLUSTER_ARN) {
  throw new Error('DATABASE_CLUSTER_ARN is not defined');
}

if (!process.env.DATABASE_SECRET_ARN) {
  throw new Error('DATABASE_SECRET_ARN is not defined');
}

export default {
  schema: './src/schema.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  driver: 'aws-data-api',
  dbCredentials: {
    database: process.env.DATABASE_NAME,
    resourceArn: process.env.DATABASE_CLUSTER_ARN,
    secretArn: process.env.DATABASE_SECRET_ARN,
  },
} satisfies Config;
