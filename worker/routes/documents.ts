import { Hono } from 'hono';
import type { AppEnv } from '../lib/auth';
import { requireAuth } from '../lib/auth';

const documents = new Hono<AppEnv>();
documents.use('*', requireAuth);

documents.get('/:id', async c => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first<{
    r2_key: string;
    name: string;
    mime: string;
  }>();
  if (!row) return c.json({ error: 'Documento não encontrado.' }, 404);

  const object = await c.env.DOCUMENTS_BUCKET.get(row.r2_key);
  if (!object) return c.json({ error: 'Arquivo não encontrado no armazenamento.' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (!headers.get('content-type')) headers.set('content-type', row.mime || 'application/octet-stream');
  headers.set('content-disposition', `inline; filename="${row.name.replace(/"/g, "'")}"`);
  headers.set('cache-control', 'private, max-age=0, must-revalidate');

  return new Response(object.body, { headers });
});

export default documents;
