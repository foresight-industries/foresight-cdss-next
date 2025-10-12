import { generateOpenApiDocument } from 'trpc-openapi';
import { insertPatientSchema, selectPatientSchema } from '@foresight-cdss-next/db/validation';

export const openApiSchema = {
  paths: {
    '/patient': {
      post: {
        requestBody: insertPatientSchema,
        responses: {
          200: selectPatientSchema,
        },
      },
    },
  },
};
