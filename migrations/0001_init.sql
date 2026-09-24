-- Usuários administrativos do painel (autenticação real, substitui o login fake do protótipo)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Administrador',
  role TEXT NOT NULL DEFAULT 'Equipe de recrutamento',
  phone TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Candidatos (médicos e colaboradores)
CREATE TABLE candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('medico','colaborador')),
  name TEXT NOT NULL,
  initials TEXT NOT NULL DEFAULT '',
  specialty TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  crm TEXT NOT NULL DEFAULT '',
  rqe TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','analise','entrevista','aguardando','aprovado','reprovado')),
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  curriculum TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  status_updated_at TEXT
);

CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_profile_type ON candidates(profile_type);

-- Metadados dos documentos; o arquivo em si fica no R2 (bucket de PDFs/imagens)
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT '',
  size INTEGER NOT NULL DEFAULT 0,
  r2_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_documents_candidate ON documents(candidate_id);

-- Agenda de entrevistas
CREATE TABLE interviews (
  id TEXT PRIMARY KEY,
  audience TEXT NOT NULL CHECK (audience IN ('medico','colaborador')),
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL,
  person_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  interviewer TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','confirmada','reagendada','em_andamento','concluida','cancelada')),
  created_at TEXT NOT NULL,
  updated_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  actual_duration_sec INTEGER
);

CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);

-- Histórico de eventos de cada entrevista.
-- "id" é gerado pelo cliente e só precisa ser único dentro da própria entrevista,
-- por isso a chave primária real é o row_id (evita colisão entre entrevistas diferentes).
CREATE TABLE interview_logs (
  row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL,
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  at TEXT NOT NULL,
  action TEXT NOT NULL,
  label TEXT NOT NULL,
  details TEXT
);

CREATE INDEX idx_logs_interview ON interview_logs(interview_id);
