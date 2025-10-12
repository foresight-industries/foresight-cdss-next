import { pgTable, text, uuid, timestamp, integer } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  mrn: text('mrn'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Automatically generate types from schema
export type Patient = InferSelectModel<typeof patients>;
export type NewPatient = InferInsertModel<typeof patients>;

// Patient type is automatically:
// {
//   id: string;
//   clerkUserId: string;
//   firstName: string;
//   lastName: string;
//   mrn: string | null;
//   createdAt: Date;
// }
