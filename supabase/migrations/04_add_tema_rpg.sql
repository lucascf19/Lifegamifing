-- Adiciona coluna tema_rpg na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tema_rpg BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.tema_rpg IS 'Preferência de tema visual: false = Minimalista (AMOLED), true = RPG (Imersivo)';
