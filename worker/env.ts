export interface Env {
  DB: D1Database;
  DOCUMENTS_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  AUTH_SECRET: string;
  RESEND_API_KEY: string;
  MFA_FROM_EMAIL?: string;
}
