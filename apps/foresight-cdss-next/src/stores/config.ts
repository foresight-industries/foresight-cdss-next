// stores/config.ts
const isDevelopment = process.env.NODE_ENV === "development";
const isLocalDev = process.env.NEXT_PUBLIC_ENV === "local";

// NEVER use DevTools in production or with real PHI
export const ENABLE_DEVTOOLS =
  isLocalDev && !process.env.NEXT_PUBLIC_USE_REAL_DATA;
