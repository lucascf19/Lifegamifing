-- ============================================
-- FUNÇÃO RPC PARA ALTERNAR ATIVIDADE (TOGGLE)
-- ============================================
-- Esta função garante atomicidade na operação de marcar/desfazer atividade

-- Remove versões antigas da função (com diferentes assinaturas)
DROP FUNCTION IF EXISTS alternar_atividade(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS alternar_atividade(TEXT, UUID) CASCADE;

CREATE OR REPLACE FUNCTION alternar_atividade(
    p_atividade_id TEXT,  -- MUDADO: Aceita TEXT para suportar UUID ou INTEGER
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_atividade RECORD;
    v_personagem RECORD;
    v_historico RECORD;
    v_buffs_ativos NUMERIC;
    v_ganhos RECORD;
    v_xp_base NUMERIC;
    v_xp_final NUMERIC;
    v_vitalidade_base INTEGER;
    v_vitalidade_final INTEGER;
    v_mana_base INTEGER;
    v_mana_final INTEGER;
    v_ja_concluida BOOLEAN;
    v_hoje_inicio TIMESTAMP WITH TIME ZONE;
    v_hoje_fim TIMESTAMP WITH TIME ZONE;
    v_resultado JSON;
BEGIN
    -- Define intervalo do dia atual
    v_hoje_inicio := DATE_TRUNC('day', NOW())::TIMESTAMP WITH TIME ZONE;
    v_hoje_fim := (DATE_TRUNC('day', NOW()) + INTERVAL '1 day' - INTERVAL '1 second')::TIMESTAMP WITH TIME ZONE;
    
    -- Detecta o tipo da coluna id na tabela atividades e converte adequadamente
    -- Tenta buscar a atividade usando o ID como está (pode ser UUID ou INTEGER)
    -- Primeiro tenta como UUID, depois como INTEGER se falhar
    BEGIN
        -- Tenta buscar como UUID
        SELECT * INTO v_atividade
        FROM atividades
        WHERE id::UUID = p_atividade_id::UUID AND user_id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
        -- Se falhar, tenta como INTEGER
        BEGIN
            SELECT * INTO v_atividade
            FROM atividades
            WHERE id::INTEGER = p_atividade_id::INTEGER AND user_id = p_user_id;
        EXCEPTION WHEN OTHERS THEN
            -- Se ambos falharem, tenta como TEXT (comparação direta)
            SELECT * INTO v_atividade
            FROM atividades
            WHERE id::TEXT = p_atividade_id AND user_id = p_user_id;
        END;
    END;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'sucesso', false,
            'erro', 'Atividade não encontrada'
        );
    END IF;
    
    -- DEBUG: Verifica se o ID da atividade foi capturado corretamente
    -- Se v_atividade.id for NULL, isso causará erro no INSERT
    IF v_atividade.id IS NULL THEN
        RETURN json_build_object(
            'sucesso', false,
            'erro', 'ID da atividade não encontrado após busca (v_atividade.id é NULL)'
        );
    END IF;
    
    -- Verifica se já está concluída hoje
    SELECT * INTO v_historico
    FROM historico_atividades
    WHERE user_id = p_user_id
        AND nome_missao = v_atividade.nome_tarefa
        AND data_completada >= v_hoje_inicio
        AND data_completada <= v_hoje_fim
    ORDER BY data_completada DESC
    LIMIT 1;
    
    v_ja_concluida := FOUND;
    
    -- Busca personagem
    SELECT * INTO v_personagem
    FROM personagens
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'sucesso', false,
            'erro', 'Personagem não encontrado'
        );
    END IF;
    
    -- Busca buffs ativos (multiplicador de XP)
    SELECT COALESCE(MAX(multiplicador), 1.0) INTO v_buffs_ativos
    FROM personagem_buffs
    WHERE user_id = p_user_id
        AND tipo_buff = 'xp'
        AND data_expiracao > NOW();
    
    IF v_buffs_ativos IS NULL THEN
        v_buffs_ativos := 1.0;
    END IF;
    
    IF v_ja_concluida THEN
        -- DESFAZER: Remove do histórico e subtrai ganhos
        DELETE FROM historico_atividades
        WHERE id = v_historico.id;
        
        -- Calcula ganhos base (sem buff, pois estamos desfazendo)
        SELECT * INTO v_ganhos
        FROM calcular_ganhos_atividade(
            COALESCE(v_atividade.categoria, ''),
            COALESCE(v_atividade.complexidade, 1),
            COALESCE(v_atividade.pontuacao, 0)
        );
        
        -- Subtrai ganhos (garantindo que não fique negativo)
        v_xp_base := COALESCE(v_personagem.experiencia, 0);
        v_xp_final := GREATEST(0, v_xp_base - COALESCE(v_atividade.pontuacao, 0));
        
        v_vitalidade_base := COALESCE(v_personagem.vitalidade, 0);
        v_vitalidade_final := GREATEST(0, v_vitalidade_base - v_ganhos.ganho_vitalidade);
        
        v_mana_base := COALESCE(v_personagem.mana, 0);
        v_mana_final := GREATEST(0, v_mana_base - v_ganhos.ganho_mana);
        
        -- Atualiza personagem
        UPDATE personagens
        SET experiencia = v_xp_final,
            vitalidade = v_vitalidade_final,
            mana = v_mana_final,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Remove da tabela atividades (status diário) se existir hoje
        DELETE FROM atividades
        WHERE user_id = p_user_id
            AND nome_tarefa = v_atividade.nome_tarefa
            AND data_completada >= v_hoje_inicio
            AND data_completada <= v_hoje_fim;
        
        RETURN json_build_object(
            'sucesso', true,
            'acao', 'desfeito',
            'xp_final', v_xp_final,
            'vitalidade_final', v_vitalidade_final,
            'mana_final', v_mana_final
        );
    ELSE
        -- MARCAR: Insere no histórico e soma ganhos
        -- Calcula ganhos base
        SELECT * INTO v_ganhos
        FROM calcular_ganhos_atividade(
            COALESCE(v_atividade.categoria, ''),
            COALESCE(v_atividade.complexidade, 1),
            COALESCE(v_atividade.pontuacao, 0)
        );
        
        -- Aplica multiplicador de buffs
        v_xp_base := COALESCE(v_atividade.pontuacao, 0);
        v_xp_final := v_xp_base * v_buffs_ativos;
        
        -- Soma ganhos
        v_xp_base := COALESCE(v_personagem.experiencia, 0);
        v_xp_final := v_xp_base + v_xp_final;
        
        v_vitalidade_base := COALESCE(v_personagem.vitalidade, 0);
        v_vitalidade_final := v_vitalidade_base + v_ganhos.ganho_vitalidade;
        
        v_mana_base := COALESCE(v_personagem.mana, 0);
        v_mana_final := v_mana_base + v_ganhos.ganho_mana;
        
        -- Atualiza personagem
        UPDATE personagens
        SET experiencia = v_xp_final,
            vitalidade = v_vitalidade_final,
            mana = v_mana_final,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Insere no histórico
        -- Nota: Se a tabela historico_atividades tiver coluna missao_id, usa o ID da atividade
        -- Se não tiver, o INSERT funcionará normalmente (colunas opcionais serão ignoradas)
        INSERT INTO historico_atividades (
            user_id,
            nome_missao,
            tipo_missao,
            categoria,
            recompensa,
            origem,
            data_completada,
            progresso,
            tempo_decorrido,
            missao_id  -- Adiciona missao_id se a coluna existir
        ) VALUES (
            p_user_id,
            v_atividade.nome_tarefa,
            COALESCE(v_atividade.regiao, 'atividade'),
            COALESCE(v_atividade.categoria, ''),
            v_xp_final - v_xp_base, -- XP ganho (com buff aplicado)
            'alternar_atividade',
            NOW(),
            100,
            0,
            v_atividade.id  -- ID da atividade (pode ser UUID ou INTEGER)
        );
        
        -- Insere na tabela atividades (status diário)
        -- Nota: A tabela atividades armazena o status diário, então inserimos uma nova linha
        INSERT INTO atividades (
            user_id,
            nome_tarefa,
            pontuacao,
            data_completada,
            regiao,
            categoria,
            tipo_logica,
            complexidade,
            dados_extras
        ) VALUES (
            p_user_id,
            v_atividade.nome_tarefa,
            v_xp_final - v_xp_base,
            NOW(),
            COALESCE(v_atividade.regiao, 'atividade'),
            COALESCE(v_atividade.categoria, ''),
            COALESCE(v_atividade.tipo_logica, 'recorrente'),
            COALESCE(v_atividade.complexidade, 1),
            jsonb_build_object('origem', 'alternar_atividade')
        );
        
        -- Se for missão única, aplica buff de impulso
        IF COALESCE(v_atividade.tipo_logica, 'recorrente') = 'unica' THEN
            INSERT INTO personagem_buffs (
                user_id,
                multiplicador,
                data_expiracao,
                descricao,
                tipo_buff
            ) VALUES (
                p_user_id,
                1.0 + (COALESCE(v_atividade.complexidade, 1) * 0.1), -- 1.1, 1.2, 1.3, 1.4, 1.5
                NOW() + INTERVAL '24 hours',
                'Buff de Impulso por completar missão única (Complexidade: ' || COALESCE(v_atividade.complexidade, 1) || ')',
                'xp'
            );
        END IF;
        
        RETURN json_build_object(
            'sucesso', true,
            'acao', 'marcado',
            'xp_final', v_xp_final,
            'vitalidade_final', v_vitalidade_final,
            'mana_final', v_mana_final,
            'buff_aplicado', CASE WHEN COALESCE(v_atividade.tipo_logica, 'recorrente') = 'unica' THEN true ELSE false END,
            'multiplicador_buff', v_buffs_ativos
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION alternar_atividade IS 'Alterna o estado de uma atividade (marcar/desfazer) de forma atômica, aplicando ganhos de XP, vitalidade e mana, e buffs quando aplicável.';

-- Garante que apenas o próprio usuário pode alternar suas atividades
GRANT EXECUTE ON FUNCTION alternar_atividade(TEXT, UUID) TO authenticated;
