-- Adiciona colunas de altura e peso na tabela profiles
-- Executar no SQL Editor do Supabase

-- Verifica se as colunas já existem antes de adicionar
DO $$ 
BEGIN
    -- Adiciona altura_cm (altura em centímetros)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'altura_cm'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN altura_cm NUMERIC(5,2);
        RAISE NOTICE 'Coluna altura_cm adicionada';
    ELSE
        RAISE NOTICE 'Coluna altura_cm já existe';
    END IF;

    -- Adiciona altura (compatibilidade)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'altura'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN altura NUMERIC(5,2);
        RAISE NOTICE 'Coluna altura adicionada';
    ELSE
        RAISE NOTICE 'Coluna altura já existe';
    END IF;

    -- Adiciona peso_kg (peso em quilogramas)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'peso_kg'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN peso_kg NUMERIC(5,2);
        RAISE NOTICE 'Coluna peso_kg adicionada';
    ELSE
        RAISE NOTICE 'Coluna peso_kg já existe';
    END IF;

    -- Adiciona peso (compatibilidade)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'peso'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN peso NUMERIC(5,2);
        RAISE NOTICE 'Coluna peso adicionada';
    ELSE
        RAISE NOTICE 'Coluna peso já existe';
    END IF;
END $$;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN profiles.altura_cm IS 'Altura do personagem em centímetros (100-250)';
COMMENT ON COLUMN profiles.altura IS 'Altura do personagem (compatibilidade com código legado)';
COMMENT ON COLUMN profiles.peso_kg IS 'Peso do personagem em quilogramas (30-300)';
COMMENT ON COLUMN profiles.peso IS 'Peso do personagem (compatibilidade com código legado)';
