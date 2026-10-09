-- Datas sempre em ISO 8601 gerado pela aplicação (ver nota no topo de 0001_init.sql);
-- nenhuma coluna aqui usa DEFAULT (datetime('now')).

-- MFA: código de verificação enviado por e-mail após a senha ser validada.
-- Só é guardado o hash do código (nunca o valor em texto puro) e há no máximo
-- um código pendente por usuário (um novo login/reenvio substitui o anterior).
CREATE TABLE mfa_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_mfa_codes_user ON mfa_codes(user_id);

-- Sessões de login. O cookie guarda um token aleatório; aqui só fica o hash dele,
-- então o banco nunca contém um valor que sirva como sessão válida por si só.
-- Isso também permite revogar sessões de verdade (logout apaga a linha).
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Histórico de tentativas de login, usado só para bloquear força bruta por e-mail.
CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  at TEXT NOT NULL
);

CREATE INDEX idx_login_attempts_identifier_at ON login_attempts(identifier, at);
