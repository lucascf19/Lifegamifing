-- Adiciona coluna humor_emoji na tabela historico_atividades
-- Para armazenar o emoji do check-in de humor após encerramento de escudo

ALTER TABLE historico_atividades 
ADD COLUMN IF NOT EXISTS humor_emoji TEXT;

COMMENT ON COLUMN historico_atividades.humor_emoji IS 'Emoji do check-in de humor após encerramento de escudo/evento';
