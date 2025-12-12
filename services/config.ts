// Configuration for external services
// WARNING: In a real production app, DATABASE_URL should NOT be exposed to the client.
// This configuration is for the prototype/demo environment to enable direct onboarding testing.

export const CONFIG = {
  DATABASE_URL: 'postgresql://neondb_owner:npg_foQS6nHjA8RV@ep-young-violet-adh2rs3d-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  STACK_AUTH: {
    PROJECT_ID: '26994b04-3842-484d-b87e-e2703d3e8292',
    CLIENT_KEY: 'pck_d5myep14420a17vdy9e3d3vp1bqz4esxfp0r0343zb5g8'
  }
};