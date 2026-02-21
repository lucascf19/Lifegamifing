-- Tabela para medicamentos da Alquimia
CREATE TABLE IF NOT EXISTS alquimia_medicamentos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    dosagem TEXT,
    horario TIME NOT NULL,
    estoque INTEGER DEFAULT 0,
    tomado_hoje BOOLEAN DEFAULT false,
    ultima_dose TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE alquimia_medicamentos ENABLE ROW LEVEL SECURITY;

-- Política de segurança (remove se existir antes de criar)
DROP POLICY IF EXISTS "Dono gerencia seus remedios" ON alquimia_medicamentos;

CREATE POLICY "Dono gerencia seus remedios" ON alquimia_medicamentos 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_alquimia_medicamentos_user_id ON alquimia_medicamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_alquimia_medicamentos_horario ON alquimia_medicamentos(horario);
CREATE INDEX IF NOT EXISTS idx_alquimia_medicamentos_tomado_hoje ON alquimia_medicamentos(tomado_hoje);

COMMENT ON TABLE alquimia_medicamentos IS 'Tabela para armazenar medicamentos cadastrados na seção Alquimia do Dashboard';
COMMENT ON COLUMN alquimia_medicamentos.horario IS 'Horário de ingestão no formato TIME (HH:MM:SS)';
COMMENT ON COLUMN alquimia_medicamentos.tomado_hoje IS 'Indica se o medicamento já foi tomado hoje';
COMMENT ON COLUMN alquimia_medicamentos.ultima_dose IS 'Timestamp da última dose tomada';
