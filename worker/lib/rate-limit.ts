import type { Env } from '../env';

const WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

export async function isRateLimited(env: Env, identifier: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const row = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM login_attempts WHERE identifier = ? AND success = 0 AND at > ?'
  ).bind(identifier, cutoff).first<{ count: number }>();
  return (row?.count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

export async function recordLoginAttempt(env: Env, identifier: string, success: boolean): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO login_attempts (identifier, success, at) VALUES (?, ?, ?)'
  ).bind(identifier, success ? 1 : 0, new Date().toISOString()).run();
}

export const RATE_LIMIT_WINDOW_MINUTES = WINDOW_MINUTES;
export const RATE_LIMIT_MAX_FAILED_ATTEMPTS = MAX_FAILED_ATTEMPTS;
