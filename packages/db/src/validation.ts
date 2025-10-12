// packages/db/src/validation.ts
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { patients } from './schema';
import { z } from 'zod';

// Auto-generate Zod schemas from Drizzle tables
export const insertPatientSchema = createInsertSchema(patients, {
  // Add custom validations
  // // email: z.email(),
  // phone: z.string().regex(/^\d{10}$/),
  // ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/).optional(),
});

export const selectPatientSchema = createSelectSchema(patients);

// Create API request/response schemas
export const createPatientRequest = insertPatientSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const patientResponse = selectPatientSchema;

// Type inference from Zod schemas
export type CreatePatientRequest = z.infer<typeof createPatientRequest>;
export type PatientResponse = z.infer<typeof patientResponse>;
