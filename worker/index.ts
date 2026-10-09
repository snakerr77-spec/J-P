import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
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

// Aplica os mesmos cabeçalhos de segurança em toda resposta — API e estáticos.
app.use(
  '*',
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      mediaSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"]
    },
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xFrameOptions: 'DENY'
  })
);

app.route('/api/auth', auth);
app.route('/api/candidates', candidates);
app.route('/api/documents', documents);
app.route('/api/interviews', interviews);
app.route('/api/public', publicRoutes);

// Qualquer rota fora de /api/* é um asset estático (HTML/JS/CSS/imagens);
// run_worker_first = true faz todo pedido passar por aqui primeiro, então
// repassamos para o binding de assets em vez de servi-los diretamente.
app.all('*', async c => {
  if (new URL(c.req.url).pathname.startsWith('/api/')) {
    return c.json({ error: 'Rota não encontrada.' }, 404);
  }
  // O Response do binding ASSETS vem com headers imutáveis; o middleware de
  // cabeçalhos de segurança precisa conseguir adicionar os dele por cima, então
  // copiamos para um Response novo (mutável) antes de devolver.
  const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
  return new Response(assetResponse.body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers: new Headers(assetResponse.headers)
  });
});

export default app;
