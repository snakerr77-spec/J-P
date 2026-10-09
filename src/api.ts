import type { Candidate, CandidateStatus, InterviewEvent, NewCandidateInput, UserProfile } from './types';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(path, { credentials: 'same-origin', ...init, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new ApiError(res.status, (data && data.error) || 'Não foi possível concluir a solicitação.');
  return data as T;
}

const apiGet = <T>(path: string) => request<T>(path);
const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined });
const apiPut = <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
const apiPatch = <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const apiDelete = <T>(path: string) => request<T>(path, { method: 'DELETE' });

export type MfaChallenge = { mfaRequired: true; email: string };

export const authApi = {
  status: () => apiGet<{ hasAdmin: boolean }>('/api/auth/status'),
  setup: (payload: { name: string; email: string; password: string }) =>
    apiPost<MfaChallenge>('/api/auth/setup', payload),
  login: (email: string, password: string) => apiPost<MfaChallenge>('/api/auth/login', { email, password }),
  verifyMfa: (code: string) => apiPost<{ profile: UserProfile }>('/api/auth/verify-mfa', { code }),
  resendMfa: () => apiPost<{ ok: true }>('/api/auth/resend-mfa'),
  logout: () => apiPost<{ ok: true }>('/api/auth/logout'),
  me: () => apiGet<{ profile: UserProfile }>('/api/auth/me'),
  updateProfile: (profile: UserProfile) => apiPut<{ profile: UserProfile }>('/api/auth/me', profile)
};

export const candidatesApi = {
  list: () => apiGet<{ candidates: Candidate[] }>('/api/candidates'),
  create: (payload: NewCandidateInput) => apiPost<{ candidate: Candidate }>('/api/candidates', payload),
  update: (id: number, patch: Partial<NewCandidateInput> & { status?: CandidateStatus }) =>
    apiPatch<{ candidate: Candidate }>(`/api/candidates/${id}`, patch)
};

export function documentUrl(id: string) {
  return `/api/documents/${id}`;
}

export const interviewsApi = {
  list: () => apiGet<{ interviews: InterviewEvent[] }>('/api/interviews'),
  create: (payload: InterviewEvent) => apiPost<{ interview: InterviewEvent }>('/api/interviews', payload),
  update: (id: string, payload: InterviewEvent) => apiPut<{ interview: InterviewEvent }>(`/api/interviews/${id}`, payload),
  remove: (id: string) => apiDelete<{ ok: true }>(`/api/interviews/${id}`)
};

export const publicApi = {
  submitApplication: (form: FormData) => apiPost<{ ok: true }>('/api/public/applications', form)
};
