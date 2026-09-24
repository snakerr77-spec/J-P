import { Hono } from 'hono';
import type { AppEnv } from './lib/auth';
import { HttpError } from './lib/http-error';
import auth from './routes/auth';
import candidates from './routes/candidates';
import documents from './routes/documents';
import interviews from './routes/interviews';
import publicRoutes from './routes/public';

const app = new Hono<AppEnv>();

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as any);
  console.error(err);
  return c.json({ error: 'Erro interno no servidor.' }, 500);
});

app.route('/api/auth', auth);
app.route('/api/candidates', candidates);
app.route('/api/documents', documents);
app.route('/api/interviews', interviews);
app.route('/api/public', publicRoutes);

app.notFound(c => c.json({ error: 'Rota não encontrada.' }, 404));

export default app;
