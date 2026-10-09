import type { Env } from '../env';
import { HttpError } from './http-error';

const DEFAULT_FROM = 'J&P Recrutamento <onboarding@resend.dev>';

export async function sendOtpEmail(env: Env, to: string, code: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new HttpError(500, 'Envio de e-mail não configurado neste servidor (RESEND_API_KEY ausente).');
  }

  const from = env.MFA_FROM_EMAIL || DEFAULT_FROM;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: `${code} é o seu código de verificação`,
      text: `Seu código de verificação para acessar o painel J&P é ${code}.\n\nEle expira em 10 minutos. Se você não tentou entrar, ignore este e-mail.`,
      html: `<div style="font-family:Arial,sans-serif;color:#173757"><p>Seu código de verificação para acessar o painel J&amp;P é:</p><p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:12px 0">${code}</p><p>Ele expira em 10 minutos. Se você não tentou entrar, ignore este e-mail.</p></div>`
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('Falha ao enviar e-mail de verificação', response.status, body);
    throw new HttpError(502, 'Não foi possível enviar o código de verificação por e-mail. Tente novamente em instantes.');
  }
}
