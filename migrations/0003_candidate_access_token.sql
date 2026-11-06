-- Token de retorno da candidatura pública: o candidato recebe um valor aleatório
-- (guardado no navegador dele) e só o hash fica aqui, igual às sessões. Permite
-- voltar depois para revisar os dados e completar os anexos sem duplicar o cadastro.
-- Fica NULL para candidatos cadastrados manualmente pelo painel.
ALTER TABLE candidates ADD COLUMN access_token_hash TEXT;

CREATE UNIQUE INDEX idx_candidates_access_token ON candidates(access_token_hash);
