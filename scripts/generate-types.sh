#!/bin/bash

# Script to generate TypeScript types from Supabase
# Usage: ./scripts/generate-types.sh [PROJECT_REF]

set -e

PROJECT_REF=${1:-$SUPABASE_PROJECT_REF}

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Error: PROJECT_REF is required"
    echo "Usage: $0 <project-ref>"
    echo "Or set SUPABASE_PROJECT_REF environment variable"
    exit 1
fi

echo "🔄 Generating TypeScript types from Supabase project: $PROJECT_REF"

# Generate types and save to the types directory
supabase gen types typescript --project-id="$PROJECT_REF" > apps/web/src/types/database.types.ts

echo "✅ TypeScript types generated successfully!"
echo "📁 Saved to: apps/web/src/types/database.types.ts"

# Optional: Generate the schema SQL for reference
echo "🔄 Pulling database schema..."
supabase db pull --project-ref="$PROJECT_REF" --schema=public

echo "✅ Schema pulled to supabase/migrations/"
