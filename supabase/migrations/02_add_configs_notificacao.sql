-- ============================================
-- MIGRAÇÃO 02: Adicionar coluna configs_notificacao
-- App Gamificação - Configurações de Notificação
-- ============================================

-- Adiciona coluna configs_notificacao na tabela profiles
-- Tipo JSONB para armazenar configurações de horários de refeições
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS configs_notificacao JSONB DEFAULT '{"cafe": "08:00", "almoco": "12:30", "jantar": "20:00"}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN profiles.configs_notificacao IS 'Configurações de horários de notificação para refeições (Café, Almoço, Jantar) em formato JSONB';
