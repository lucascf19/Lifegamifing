-- ============================================
-- MIGRAÇÃO 01: Estrutura Base do Banco de Dados
-- App Gamificação - Schema Completo
-- ============================================

-- ============================================
-- TABELA: profiles
-- Armazena os dados do perfil do usuário/avatar
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nome_usuario TEXT NOT NULL,
    classe TEXT DEFAULT 'Explorador do Caos',
    nivel INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    energia_total INTEGER DEFAULT 0,
    foco_total INTEGER DEFAULT 0,
    modo_escudo TEXT DEFAULT 'desativado' CHECK (modo_escudo IN ('desativado', 'compromisso', 'recuperacao')),
    escudo_expira_em TIMESTAMPTZ,
    config_alerta_agua INTEGER DEFAULT 120, -- minutos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_nivel ON profiles(nivel);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp);
CREATE INDEX IF NOT EXISTS idx_profiles_modo_escudo ON profiles(modo_escudo);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELA: atividades
-- Armazena atividades simples (água, eventos, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS atividades (
    id BIGSERIAL PRIMARY KEY,
    nome_tarefa TEXT NOT NULL,
    pontuacao INTEGER DEFAULT 0,
    categoria TEXT,
    regiao TEXT DEFAULT 'sa-east-1',
    data_completada TIMESTAMPTZ DEFAULT NOW(),
    dados_extras JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_atividades_user_id ON atividades(user_id);
CREATE INDEX IF NOT EXISTS idx_atividades_data_completada ON atividades(data_completada);
CREATE INDEX IF NOT EXISTS idx_atividades_categoria ON atividades(categoria);
CREATE INDEX IF NOT EXISTS idx_atividades_data_completada_desc ON atividades(data_completada DESC);

-- ============================================
-- TABELA: historico_atividades
-- Armazena histórico completo de missões completadas
-- ============================================
CREATE TABLE IF NOT EXISTS historico_atividades (
    id BIGSERIAL PRIMARY KEY,
    missao_id TEXT,
    nome_missao TEXT NOT NULL,
    tipo_missao TEXT DEFAULT 'checklist',
    categoria TEXT,
    recompensa INTEGER DEFAULT 0,
    pontuacao INTEGER DEFAULT 0,
    origem TEXT DEFAULT 'daily', -- 'daily' ou 'board'
    data_completada TIMESTAMPTZ DEFAULT NOW(),
    progresso JSONB, -- Para missões progressivas (ex: água)
    tempo_decorrido INTEGER, -- Para missões de timer (em segundos)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_user_id ON historico_atividades(user_id);
CREATE INDEX IF NOT EXISTS idx_historico_data_completada ON historico_atividades(data_completada);
CREATE INDEX IF NOT EXISTS idx_historico_origem ON historico_atividades(origem);
CREATE INDEX IF NOT EXISTS idx_historico_categoria ON historico_atividades(categoria);
CREATE INDEX IF NOT EXISTS idx_historico_data_completada_desc ON historico_atividades(data_completada DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Políticas de segurança para acesso aos dados
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuarios podem ver o proprio perfil" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id);

-- Usuários podem inserir apenas seu próprio perfil
CREATE POLICY "Usuarios podem inserir o proprio perfil" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuarios podem editar o proprio perfil" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Políticas para atividades
-- Usuários podem ver apenas suas próprias atividades
CREATE POLICY "Usuarios podem ver suas atividades" 
    ON atividades FOR SELECT 
    USING (auth.uid() = user_id);

-- Usuários podem inserir apenas suas próprias atividades
CREATE POLICY "Usuarios podem inserir suas atividades" 
    ON atividades FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Políticas para historico_atividades
-- Usuários podem ver apenas seu próprio histórico
CREATE POLICY "Usuarios podem ver seu historico" 
    ON historico_atividades FOR SELECT 
    USING (auth.uid() = user_id);

-- Usuários podem inserir apenas em seu próprio histórico
CREATE POLICY "Usuarios podem inserir em seu historico" 
    ON historico_atividades FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para obter estatísticas do usuário
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
    total_xp INTEGER,
    total_energia INTEGER,
    total_foco INTEGER,
    nivel_atual INTEGER,
    atividades_hoje BIGINT,
    atividades_mes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.xp, 0)::INTEGER as total_xp,
        COALESCE(p.energia_total, 0)::INTEGER as total_energia,
        COALESCE(p.foco_total, 0)::INTEGER as total_foco,
        COALESCE(p.nivel, 1)::INTEGER as nivel_atual,
        COUNT(DISTINCT CASE WHEN DATE(a.data_completada) = CURRENT_DATE THEN a.id END)::BIGINT as atividades_hoje,
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', a.data_completada) = DATE_TRUNC('month', CURRENT_DATE) THEN a.id END)::BIGINT as atividades_mes
    FROM profiles p
    LEFT JOIN atividades a ON a.user_id = p.id
    WHERE p.id = p_user_id
    GROUP BY p.id, p.xp, p.energia_total, p.foco_total, p.nivel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================
COMMENT ON TABLE profiles IS 'Perfis de usuários/avatares do jogo';
COMMENT ON TABLE atividades IS 'Atividades simples registradas (água, eventos, etc.)';
COMMENT ON TABLE historico_atividades IS 'Histórico completo de missões completadas';

COMMENT ON COLUMN profiles.modo_escudo IS 'Estado do escudo: desativado, compromisso (2h), recuperacao (sem timer)';
COMMENT ON COLUMN profiles.config_alerta_agua IS 'Intervalo de alerta de água em minutos';
COMMENT ON COLUMN historico_atividades.origem IS 'Origem da missão: daily (diárias) ou board (quadro de missões)';
COMMENT ON COLUMN historico_atividades.progresso IS 'Dados de progresso para missões progressivas (ex: quantidade de água)';
COMMENT ON COLUMN historico_atividades.tempo_decorrido IS 'Tempo decorrido em segundos para missões de timer';
