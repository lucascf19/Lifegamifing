-- ============================================
-- REESTRUTURAÇÃO DE ATRIBUTOS E MISSÕES
-- ============================================
-- Esta migração adiciona novos atributos ao sistema de gamificação
-- Execute este SQL no SQL Editor do Supabase

-- ============================================
-- 1. ADICIONAR COLUNAS NA TABELA personagens
-- ============================================

DO $$ 
BEGIN
    -- Adiciona coluna vitalidade (inteiro)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personagens' AND column_name = 'vitalidade'
    ) THEN
        ALTER TABLE personagens 
        ADD COLUMN vitalidade INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna vitalidade adicionada na tabela personagens';
    ELSE
        RAISE NOTICE 'Coluna vitalidade já existe na tabela personagens';
    END IF;

    -- Adiciona coluna mana (inteiro)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personagens' AND column_name = 'mana'
    ) THEN
        ALTER TABLE personagens 
        ADD COLUMN mana INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna mana adicionada na tabela personagens';
    ELSE
        RAISE NOTICE 'Coluna mana já existe na tabela personagens';
    END IF;
END $$;

-- Comentários nas colunas
COMMENT ON COLUMN personagens.vitalidade IS 'Vitalidade do personagem (atributo físico)';
COMMENT ON COLUMN personagens.mana IS 'Mana do personagem (atributo mental)';

-- ============================================
-- 2. ADICIONAR COLUNAS NA TABELA atividades
-- ============================================

DO $$ 
BEGIN
    -- Adiciona coluna tipo_logica ('recorrente' ou 'unica')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'atividades' AND column_name = 'tipo_logica'
    ) THEN
        ALTER TABLE atividades 
        ADD COLUMN tipo_logica TEXT CHECK (tipo_logica IN ('recorrente', 'unica'));
        RAISE NOTICE 'Coluna tipo_logica adicionada na tabela atividades';
    ELSE
        RAISE NOTICE 'Coluna tipo_logica já existe na tabela atividades';
    END IF;

    -- Adiciona coluna complexidade (1 a 5)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'atividades' AND column_name = 'complexidade'
    ) THEN
        ALTER TABLE atividades 
        ADD COLUMN complexidade INTEGER CHECK (complexidade >= 1 AND complexidade <= 5);
        RAISE NOTICE 'Coluna complexidade adicionada na tabela atividades';
    ELSE
        RAISE NOTICE 'Coluna complexidade já existe na tabela atividades';
    END IF;

    -- Verifica se a coluna categoria já existe e se precisa ser alterada
    -- Se já existe, apenas verifica se é TEXT (extensível)
    -- Se não existe, cria como TEXT para ser extensível
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'atividades' AND column_name = 'categoria'
    ) THEN
        ALTER TABLE atividades 
        ADD COLUMN categoria TEXT;
        RAISE NOTICE 'Coluna categoria adicionada na tabela atividades';
    ELSE
        -- Se já existe, verifica se é TEXT. Se for ENUM ou outro tipo, pode precisar de migração manual
        RAISE NOTICE 'Coluna categoria já existe na tabela atividades';
    END IF;
END $$;

-- Comentários nas colunas
COMMENT ON COLUMN atividades.tipo_logica IS 'Tipo de lógica da atividade: recorrente (pode ser feita múltiplas vezes) ou unica (apenas uma vez)';
COMMENT ON COLUMN atividades.complexidade IS 'Complexidade da atividade (1 a 5)';
COMMENT ON COLUMN atividades.categoria IS 'Categoria da atividade: fisico, mental, saude, medicamento, etc. (extensível)';

-- ============================================
-- 3. CRIAR TABELA personagem_buffs
-- ============================================

CREATE TABLE IF NOT EXISTS personagem_buffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    multiplicador NUMERIC(5,2) NOT NULL DEFAULT 1.0 CHECK (multiplicador > 0),
    data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
    descricao TEXT,
    tipo_buff TEXT, -- Ex: 'xp', 'vitalidade', 'mana', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_personagem_buffs_user_id ON personagem_buffs(user_id);
CREATE INDEX IF NOT EXISTS idx_personagem_buffs_data_expiracao ON personagem_buffs(data_expiracao);
CREATE INDEX IF NOT EXISTS idx_personagem_buffs_user_expiracao ON personagem_buffs(user_id, data_expiracao);

-- Comentários na tabela
COMMENT ON TABLE personagem_buffs IS 'Armazena bônus temporários aplicados aos personagens';
COMMENT ON COLUMN personagem_buffs.user_id IS 'ID do usuário que possui o buff';
COMMENT ON COLUMN personagem_buffs.multiplicador IS 'Multiplicador do bônus (ex: 1.5 = 50% de aumento)';
COMMENT ON COLUMN personagem_buffs.data_expiracao IS 'Data e hora de expiração do buff';
COMMENT ON COLUMN personagem_buffs.tipo_buff IS 'Tipo do buff (xp, vitalidade, mana, etc.)';

-- ============================================
-- 4. CRIAR TABELA resumo_diario
-- ============================================

CREATE TABLE IF NOT EXISTS resumo_diario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    vitalidade_final INTEGER DEFAULT 0,
    mana_final INTEGER DEFAULT 0,
    atividades_completadas INTEGER DEFAULT 0,
    xp_ganho_total NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, data) -- Um resumo por usuário por dia
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_resumo_diario_user_id ON resumo_diario(user_id);
CREATE INDEX IF NOT EXISTS idx_resumo_diario_data ON resumo_diario(data);
CREATE INDEX IF NOT EXISTS idx_resumo_diario_user_data ON resumo_diario(user_id, data);

-- Comentários na tabela
COMMENT ON TABLE resumo_diario IS 'Consolida o progresso diário de cada usuário';
COMMENT ON COLUMN resumo_diario.user_id IS 'ID do usuário';
COMMENT ON COLUMN resumo_diario.data IS 'Data do resumo (sem hora)';
COMMENT ON COLUMN resumo_diario.vitalidade_final IS 'Vitalidade final do dia após todas as atividades';
COMMENT ON COLUMN resumo_diario.mana_final IS 'Mana final do dia após todas as atividades';
COMMENT ON COLUMN resumo_diario.atividades_completadas IS 'Número total de atividades completadas no dia';
COMMENT ON COLUMN resumo_diario.xp_ganho_total IS 'XP total ganho no dia';

-- ============================================
-- 5. FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================

-- Função para atualizar updated_at nas tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_personagem_buffs_updated_at ON personagem_buffs;
CREATE TRIGGER update_personagem_buffs_updated_at
    BEFORE UPDATE ON personagem_buffs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resumo_diario_updated_at ON resumo_diario;
CREATE TRIGGER update_resumo_diario_updated_at
    BEFORE UPDATE ON resumo_diario
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. FUNÇÃO PARA CALCULAR GANHOS BASEADOS EM CATEGORIA
-- ============================================
-- Esta função pode ser usada para calcular ganhos de vitalidade/mana baseados na categoria da atividade

CREATE OR REPLACE FUNCTION calcular_ganhos_atividade(
    p_categoria TEXT,
    p_complexidade INTEGER DEFAULT 1,
    p_pontuacao NUMERIC DEFAULT 0
)
RETURNS TABLE (
    ganho_vitalidade INTEGER,
    ganho_mana INTEGER
) AS $$
DECLARE
    base_vitalidade INTEGER;
    base_mana INTEGER;
BEGIN
    -- Inicializa valores base
    base_vitalidade := 0;
    base_mana := 0;
    
    -- Calcula ganhos baseados na categoria
    CASE p_categoria
        WHEN 'fisico' THEN
            -- Atividades físicas somam em vitalidade
            -- Base: complexidade * 10, mais bônus de pontuação
            base_vitalidade := (p_complexidade * 10) + FLOOR(p_pontuacao / 10)::INTEGER;
            base_mana := 0;
            
        WHEN 'mental' THEN
            -- Atividades mentais somam em mana
            -- Base: complexidade * 10, mais bônus de pontuação
            base_mana := (p_complexidade * 10) + FLOOR(p_pontuacao / 10)::INTEGER;
            base_vitalidade := 0;
            
        WHEN 'saude' THEN
            -- Atividades de saúde podem somar em ambos (ou apenas vitalidade)
            base_vitalidade := (p_complexidade * 5) + FLOOR(p_pontuacao / 20)::INTEGER;
            base_mana := (p_complexidade * 5) + FLOOR(p_pontuacao / 20)::INTEGER;
            
        WHEN 'medicamento' THEN
            -- Medicamentos podem ter lógica especial (futura expansão)
            -- Por enquanto, apenas vitalidade
            base_vitalidade := (p_complexidade * 8) + FLOOR(p_pontuacao / 15)::INTEGER;
            base_mana := 0;
            
        ELSE
            -- Categoria desconhecida ou não mapeada (extensível)
            -- Por padrão, não dá ganhos (pode ser customizado)
            base_vitalidade := 0;
            base_mana := 0;
    END CASE;
    
    RETURN QUERY SELECT base_vitalidade, base_mana;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_ganhos_atividade IS 'Calcula ganhos de vitalidade e mana baseados na categoria e complexidade da atividade. Extensível para novas categorias.';

-- ============================================
-- 7. POLÍTICAS RLS (Row Level Security)
-- ============================================
-- Habilitar RLS nas novas tabelas

ALTER TABLE personagem_buffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumo_diario ENABLE ROW LEVEL SECURITY;

-- Políticas para personagem_buffs
DROP POLICY IF EXISTS "Usuários podem ver seus próprios buffs" ON personagem_buffs;
CREATE POLICY "Usuários podem ver seus próprios buffs"
    ON personagem_buffs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios buffs" ON personagem_buffs;
CREATE POLICY "Usuários podem inserir seus próprios buffs"
    ON personagem_buffs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios buffs" ON personagem_buffs;
CREATE POLICY "Usuários podem atualizar seus próprios buffs"
    ON personagem_buffs FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios buffs" ON personagem_buffs;
CREATE POLICY "Usuários podem deletar seus próprios buffs"
    ON personagem_buffs FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para resumo_diario
DROP POLICY IF EXISTS "Usuários podem ver seus próprios resumos" ON resumo_diario;
CREATE POLICY "Usuários podem ver seus próprios resumos"
    ON resumo_diario FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios resumos" ON resumo_diario;
CREATE POLICY "Usuários podem inserir seus próprios resumos"
    ON resumo_diario FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios resumos" ON resumo_diario;
CREATE POLICY "Usuários podem atualizar seus próprios resumos"
    ON resumo_diario FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios resumos" ON resumo_diario;
CREATE POLICY "Usuários podem deletar seus próprios resumos"
    ON resumo_diario FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 8. VERIFICAÇÃO FINAL
-- ============================================

-- Verifica se as colunas foram adicionadas corretamente
SELECT 
    'personagens' as tabela,
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'personagens' 
AND column_name IN ('vitalidade', 'mana')
ORDER BY column_name;

-- Verifica se as colunas foram adicionadas corretamente
SELECT 
    'atividades' as tabela,
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'atividades' 
AND column_name IN ('tipo_logica', 'complexidade', 'categoria')
ORDER BY column_name;

-- Verifica se as novas tabelas foram criadas
SELECT 
    table_name,
    'criada' as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('personagem_buffs', 'resumo_diario')
ORDER BY table_name;
