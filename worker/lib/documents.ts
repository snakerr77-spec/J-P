import type { Env } from '../env';
import { HttpError } from './http-error';
import type { CandidateDocument } from '../../shared/types';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_EXT = /\.(pdf|jpe?g|png)$/i;
const MAX_SIZE = 10 * 1024 * 1024;

export function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE) return `O arquivo ${file.name} ultrapassa o limite de 10 MB.`;
  const allowed = ALLOWED_MIME.has(file.type) || ALLOWED_EXT.test(file.name);
  if (!allowed) return 'Envie apenas arquivos PDF, JPG ou PNG.';
  return null;
}

function sanitizeFilename(name: string) {
  const cleaned = name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_');
  return cleaned.slice(-80) || 'arquivo';
}

export async function storeDocument(env: Env, candidateId: number, type: string, label: string, file: File): Promise<CandidateDocument> {
  const error = validateFile(file);
  if (error) throw new HttpError(400, error);

  const id = crypto.randomUUID();
  const mime = file.type || 'application/octet-stream';
  const r2Key = `candidates/${candidateId}/${id}-${sanitizeFilename(file.name)}`;

  await env.DOCUMENTS_BUCKET.put(r2Key, file.stream(), {
    httpMetadata: { contentType: mime }
  });

  await env.DB.prepare(
    `INSERT INTO documents (id, candidate_id, type, label, name, mime, size, r2_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, candidateId, type, label, file.name, mime, file.size, r2Key).run();

  return { id, type, label, name: file.name, mime, size: file.size };
}
