/**
 * LIFE GAMING - SCRIPT DE LÓGICA CORE
 * Versão Estabilizada com Handshake React-JS
 */
 
console.log('🚀 script.js iniciando carregamento...');
console.log('✅ SCRIPT.JS CARREGADO NA PASTA PUBLIC');

// ============================================
// DEFINIÇÕES INICIAIS - Garantir que funções críticas existam antes de qualquer uso
// ============================================

// Variável global para armazenar a classe
window.classeSelecionada = null;

// ============================================
// STUBS INICIAIS - Garantir que funções críticas existam antes de qualquer uso
// Estas funções serão sobrescritas com a implementação completa mais abaixo
// ============================================

window.collapseFocusTimer = function() {
    console.log('[collapseFocusTimer] Função ainda não inicializada completamente');
};

window.expandFocusTimer = function() {
    console.log('[expandFocusTimer] Função ainda não inicializada completamente');
};

window.addWaterInstant = function() {
    console.log('[addWaterInstant] Função ainda não inicializada completamente');
};

window.openWaterSettings = function() {
    console.log('[openWaterSettings] Função ainda não inicializada completamente');
};

window.marcarRefeicao = function() {
    console.log('[marcarRefeicao] Função ainda não inicializada completamente');
};

window.toggleFAB = function() {
    console.log('[toggleFAB] Função ainda não inicializada completamente');
};

window.startFocusTimer = function() {
    console.log('[startFocusTimer] Função ainda não inicializada completamente');
};

window.pauseFocusTimer = function() {
    console.log('[pauseFocusTimer] Função ainda não inicializada completamente');
};

window.finishFocusTimer = function() {
    console.log('[finishFocusTimer] Função ainda não inicializada completamente');
};

// Função global para selecionar classe
window.selecionarClasse = function(nomeClasse) {
    // Salva de forma global
    window.classeSelecionada = nomeClasse;
    console.log('✅ Classe confirmada globalmente:', window.classeSelecionada);
    
    // Feedback visual: atualiza os cards de classe
    try {
        document.querySelectorAll('.class-card').forEach(card => {
            card.classList.remove('selected', 'border-yellow-500');
            const cardText = card.textContent || '';
            const dataClasse = card.getAttribute('data-classe') || '';
            if (dataClasse === nomeClasse || cardText.includes(nomeClasse)) {
                card.classList.add('selected', 'border-yellow-500');
            }
        });
    } catch (e) {
        console.warn('⚠️ Erro ao aplicar destaque visual da classe:', e);
    }
    
    // Feedback imediato para o usuário (especialmente útil no Android)
    alert('Classe ' + nomeClasse + ' selecionada!');
};

// Função global para criar personagem (com Peso e Altura)
window.criarPersonagem = async function() {
    // Desativar o botão para evitar cliques duplos
    const btn = document.getElementById('btn-iniciar-jornada');
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Carregando...';
    }
    
    console.log('🚀 [criarPersonagem] BOTÃO CLICADO - INICIANDO CRIAÇÃO');
    console.log('[criarPersonagem] Botão clicado via mouse/teclado ou toque');
    
    try {
        const nome = document.getElementById('char-name')?.value;
        const peso = document.getElementById('input-peso')?.value;
        const altura = document.getElementById('input-altura')?.value;
        const classe = window.classeSelecionada;
        
        console.log('[criarPersonagem] Dados capturados:', { nome, peso, altura, classe });
        
        if (!nome || !classe) {
            // Reativar o botão em caso de validação falha
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-rocket mr-2"></i> Iniciar Jornada';
            }
            console.warn('[criarPersonagem] Validação falhou: nome ou classe ausentes.', { nomePreenchido: !!nome, classeSelecionada: !!classe });
            return;
        }
        
        // ... resto do código de salvamento
        const client = window.supabaseClient;
        const { data: { user } } = await client.auth.getUser();

        // Verifica se o personagem já existe para este usuário antes de tentar criar
        const { data: existente, error: erroCheck } = await client
            .from('personagens')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (erroCheck) {
            console.error('[criarPersonagem] Erro ao verificar personagem existente:', JSON.stringify(erroCheck, null, 2));
            // Reativar o botão, pois não vamos prosseguir com o insert
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-rocket mr-2"></i> Iniciar Jornada';
            }
            return;
        }

        if (existente) {
            console.log('✅ [criarPersonagem] Personagem já existia. Pulando criação e carregando jogo.');
            window.verificarPersonagemExistente?.();
            return;
        }

        const dadosParaEnviar = {
            // Campos devem bater exatamente com as colunas da tabela "personagens"
            // Mantemos apenas os que temos certeza que existem:
            user_id: user.id,
            nome: nome,
            classe: classe,
            peso: parseFloat(peso.replace(',', '.')),
            altura: parseFloat(altura.replace(',', '.'))
            // Se existirem colunas como "nivel" ou "experiencia",
            // podemos adicioná-las depois que forem confirmadas no Supabase.
        };

        console.log('📦 [criarPersonagem] Enviando para o Supabase:', JSON.stringify(dadosParaEnviar, null, 2));

        const { error } = await client
            .from('personagens')
            .insert([dadosParaEnviar]);

        if (error) {
            // Se o erro for de duplicidade (personagem já existe), apenas segue para o jogo
            if (error.code === '23505') {
                console.log('✅ [criarPersonagem] Personagem já existe, ignorando erro de duplicidade (23505).');
                // Apenas chama a função que verifica/esconde a tela de criação e mostra o jogo
                window.verificarAutenticacao?.();
                return;
            }
            
            // Reativar o botão em caso de erro real do Supabase
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-rocket mr-2"></i> Iniciar Jornada';
            }
            console.error('❌ [criarPersonagem] Erro real do Supabase:', JSON.stringify(error, null, 2));
            return;
        }

        console.log('✅ [criarPersonagem] Personagem criado com sucesso no Supabase.');
        window.verificarAutenticacao?.(); // Atualiza a tela para o Dashboard
    } catch (e) {
        // Reativar o botão em caso de erro crítico
        const btnError = document.getElementById('btn-iniciar-jornada');
        if (btnError) {
            btnError.disabled = false;
            btnError.innerHTML = '<i class="fas fa-rocket mr-2"></i> Iniciar Jornada';
        }
        console.error('💥 [criarPersonagem] Erro crítico na função criarPersonagem:', e);
    }
};

// Função para centralizar o cliente do Supabase (usada em outras partes do script)
const getClient = () => window.supabaseClient;

// ============================================
// FUNÇÕES DE UTILIDADE E FLUXO DE TELA
// ============================================
const mostrarElemento = (id) => {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'block';
        el.classList.remove('hidden');
        // Se for a tela de criação, habilita pointer-events
        if (id === 'characterCreationScreen') {
            el.style.pointerEvents = 'auto';
        }
    }
};

const esconderElemento = (id) => {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
        el.classList.add('hidden');
        // Garantir z-index negativo quando oculto
        if (id === 'loginScreen' || id === 'characterCreationScreen') {
            el.style.zIndex = '-1';
        }
    }
};

// Esconde a tela de criação de personagem de forma segura
window.esconderCriacao = function() {
    const screen = document.getElementById('characterCreationScreen');
    if (screen) {
        // Garante que a tela some completamente e não bloqueie cliques
        screen.style.setProperty('display', 'none', 'important');
        screen.style.pointerEvents = 'none';
        console.log('[esconderCriacao] Tela de criação escondida com sucesso.');
    }
};

/**
 * Verifica se o usuário já possui um personagem criado.
 * - Se existir: esconde a tela de criação e mostra o jogo.
 * - Se não existir: esconde o jogo e mostra o formulário de criação.
 */
window.verificarPersonagemExistente = async function() {
    console.log('🔍 [verificarPersonagemExistente] Iniciando verificação de personagem...');
    
    const client = getClient();
    if (!client) {
        console.error('❌ [verificarPersonagemExistente] Erro: Supabase não inicializado no window.');
        return;
    }

    try {
        const { data: { session } } = await client.auth.getSession();
        if (!session) {
            console.warn('⚠️ [verificarPersonagemExistente] Nenhuma sessão ativa encontrada.');
            return;
        }

        const { data, error } = await client
            .from('personagens')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            console.log('✅ [verificarPersonagemExistente] Personagem encontrado:', data.nome);
            window.personagemData = data;
            
            // REMOVER BLOQUEIOS DE CLIQUE: Garantir que telas de login, loading e criação estejam completamente escondidas
            const loginScreen = document.getElementById('loginScreen');
            const loginContainer = document.getElementById('login-container');
            const creationScreen = document.getElementById('characterCreationScreen');
            const loadingScreen = document.querySelector('[style*="Carregando"]');
            const auraEscudo = document.getElementById('aura-escudo');
            
            // Esconder e desabilitar todas as telas que podem bloquear
            [loginScreen, loginContainer, creationScreen, loadingScreen, auraEscudo].forEach(el => {
                if (el) {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.pointerEvents = 'none';
                    el.style.zIndex = '-1';
                    el.classList.add('hidden');
                    console.log(`🔒 [verificarPersonagemExistente] Elemento ${el.id || 'sem-id'} bloqueado e oculto`);
                }
            });
            
            // Esconder a tela de criação de forma centralizada
            if (typeof window.esconderCriacao === 'function') {
                window.esconderCriacao();
            }
            
            // Mostrar o jogo
            const appContainer = document.getElementById('app-container');
            const dashboardPage = document.getElementById('dashboard-page');
            if (appContainer) {
                appContainer.style.display = 'flex'; // Usa flex para manter o layout correto
                appContainer.style.pointerEvents = 'auto'; // Garante que receba cliques
                appContainer.classList.remove('hidden');
            }
            if (dashboardPage) {
                dashboardPage.style.display = 'block';
                dashboardPage.classList.remove('hidden');
            }
            
            // Atualizar elementos da UI com os dados do personagem
            const userLevelEl = document.getElementById('userLevel');
            const xpDisplayEl = document.getElementById('xpDisplay');
            const xpBarEl = document.getElementById('xpBar');
            
            // Atualizar nível (assumindo que existe um campo 'nivel' ou usando padrão 1)
            if (userLevelEl) {
                userLevelEl.textContent = data.nivel || data.level || 1;
            }
            
            // Atualizar XP (assumindo que existe um campo 'experiencia' ou 'xp')
            const xp = data.experiencia || data.xp || 0;
            if (xpDisplayEl) {
                xpDisplayEl.textContent = `${xp} XP`;
            }
            
            // Atualizar barra de XP (calculando porcentagem baseada em XP necessário para próximo nível)
            // Assumindo que cada nível requer 100 XP (ajuste conforme necessário)
            if (xpBarEl) {
                const xpNecessario = 100; // XP necessário para subir de nível
                const xpAtual = xp % xpNecessario; // XP do nível atual
                const porcentagem = (xpAtual / xpNecessario) * 100;
                xpBarEl.style.width = `${Math.min(porcentagem, 100)}%`;
            }

            // Carregar estado das provisões do dia atual
            try {
                await carregarEstadoProvisoesParaHoje(session.user.id);
            } catch (e) {
                console.error('[verificarPersonagemExistente] Erro ao carregar estado das provisões:', e);
            }
            
            console.log('🎮 [verificarPersonagemExistente] UI atualizada com dados do personagem:', {
                nome: data.nome,
                nivel: data.nivel || data.level || 1,
                xp: xp
            });
        } else {
            console.log('💡 [verificarPersonagemExistente] Nenhum personagem encontrado. Mostrando tela de criação.');
            esconderElemento('dashboard-page');
            esconderElemento('app-container');
            mostrarElemento('characterCreationScreen');
        }
    } catch (err) {
        console.error('❌ [verificarPersonagemExistente] Erro crítico na verificação:', err.message);
    }
};

// Mantém compatibilidade com o código existente que ainda chama verificarAutenticacao
window.verificarAutenticacao = async function() {
    console.log('[verificarAutenticacao] Delegando para verificarPersonagemExistente...');
    return window.verificarPersonagemExistente();
};

// Função global para fazer logout
window.fazerLogout = async () => {
    console.log("🚀 [fazerLogout] Iniciando logout...");
    
    // 1. Comando de saída no Supabase
    const { error } = await window.supabaseClient.auth.signOut();
    
    if (error) {
        console.error("❌ [fazerLogout] Erro ao sair:", error.message);
        return;
    }

    // 2. Limpar dados globais da memória
    window.personagemData = null;

    // 3. Resetar a UI: Esconder o jogo e mostrar que está deslogado
    // (O React cuidará da tela de login, mas o JS limpa os containers do jogo)
    const appContainer = document.getElementById('app-container');
    const dashboardPage = document.getElementById('dashboard-page');
    
    if (appContainer) {
        appContainer.style.display = 'none';
    }
    if (dashboardPage) {
        dashboardPage.style.display = 'none';
    }
    
    // Opcional: Limpar campos de texto do dashboard para segurança
    const userLevelEl = document.getElementById('userLevel');
    if (userLevelEl) {
        userLevelEl.innerText = '-';
    }
    
    console.log("✅ [fazerLogout] Logout concluído com sucesso.");
};

// Função para atualizar a interface de status (Dashboard e ícones)
window.atualizarInterfaceStatus = function(data) {
    // LIMPEZA CRÍTICA: remove elementos antigos antes de criar os novos
    
    // NOTA: Não limpar status-icons-container pois os botões são estáticos no HTML
    // Apenas limpar containers que são renderizados dinamicamente

    // 2. Limpeza do container de missões (se renderizado dinamicamente)
    const missionsContainer = document.getElementById('missionsContainer');
    if (missionsContainer) {
        // Só limpa se for renderizado dinamicamente (verificar antes de usar)
        // missionsContainer.innerHTML = '';
        console.log('[atualizarInterfaceStatus] Container de missões verificado.');
    }

    // 3. Limpeza do container de shop/inventário (se renderizado dinamicamente)
    const shopContainer = document.getElementById('shopContainer');
    if (shopContainer) {
        // Só limpa se for renderizado dinamicamente (verificar antes de usar)
        // shopContainer.innerHTML = '';
        console.log('[atualizarInterfaceStatus] Container de shop verificado.');
    }

    // 4. Limpeza do container de provisões (se renderizado dinamicamente)
    const containerProvisoes = document.querySelector('#dashboard-page .bg-\\[\\#121212\\] .grid');
    if (containerProvisoes && containerProvisoes.parentElement?.querySelector('h3')?.textContent?.includes('Provisões')) {
        // Se o container de provisões for renderizado dinamicamente, limpar aqui
        // containerProvisoes.innerHTML = '';
        console.log('[atualizarInterfaceStatus] Container de provisões verificado.');
    }

    // ... restante do código que cria os ícones e provisões ...
    // (Aqui você pode adicionar a lógica para criar os novos elementos baseado nos dados)
    console.log('[atualizarInterfaceStatus] Interface de status limpa e pronta para atualização.');
};

// Função auxiliar para limpar containers antes de renderizar
window.limparContainerAntesDeRenderizar = function(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
        console.log(`[limparContainerAntesDeRenderizar] Container '${containerId}' limpo.`);
        return true;
    }
    console.warn(`[limparContainerAntesDeRenderizar] Container '${containerId}' não encontrado.`);
    return false;
};

// ============================================
// FUNÇÕES GLOBAIS DO JOGO (para evitar erros "is not defined")
// ============================================

// Toggle do FAB (Floating Action Button)
window.toggleFAB = function() {
    const fabMenu = document.getElementById('fabMenu');
    const fabMainIcon = document.getElementById('fabMainIcon');
    if (fabMenu) {
        fabMenu.classList.toggle('hidden');
        if (fabMainIcon) {
            fabMainIcon.textContent = fabMenu.classList.contains('hidden') ? '+' : '×';
        }
    }
};

// ============================================
// SISTEMA DE PROVISÕES (Café, Almoço, Jantar)
// - Registro diário (atividades_diarias)
// - Histórico (historico_atividades)
// - Atualização de XP/Vitalidade em personagens
// - Toggle com desfazer seguro (apenas no dia atual)
// ============================================

const PROVISOES_CONFIG = {
    cafe: { xp: 10, vitalidade: 5, iconId: 'status-cafe', btnId: 'btn-cafe' },
    almoco: { xp: 10, vitalidade: 5, iconId: 'status-almoco', btnId: 'btn-almoco' },
    jantar: { xp: 10, vitalidade: 5, iconId: 'status-jantar', btnId: 'btn-jantar' }
};

// Controle de debounce por tipo de provisão
const provisoesUltimoClique = {};
const PROVISOES_DEBOUNCE_MS = 1000;

function getHojeISODate() {
    // Apenas parte da data YYYY-MM-DD em UTC
    return new Date().toISOString().slice(0, 10);
}

function getHojeIntervalo() {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    return {
        inicio: inicio.toISOString(),
        fim: fim.toISOString()
    };
}

// Atualiza o estado visual de uma provisão (Dashboard + header)
function atualizarEstadoProvisaoUI(tipo, concluida) {
    const cfg = PROVISOES_CONFIG[tipo];
    if (!cfg) return;

    const iconHeader = document.getElementById(cfg.iconId);
    const btnDashboard = document.getElementById(cfg.btnId);

    if (concluida) {
        if (iconHeader) {
            iconHeader.classList.add('ring-2', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-black');
        }
        if (btnDashboard) {
            btnDashboard.textContent = 'Concluído';
            btnDashboard.disabled = false; // ainda permite desfazer
            btnDashboard.classList.remove('bg-orange-600', 'hover:bg-orange-700');
            btnDashboard.classList.add('bg-green-600', 'hover:bg-green-700');
        }
    } else {
        if (iconHeader) {
            iconHeader.classList.remove('ring-2', 'ring-yellow-400', 'ring-offset-2', 'ring-offset-black');
        }
        if (btnDashboard) {
            btnDashboard.textContent = 'Marcar';
            btnDashboard.disabled = false;
            btnDashboard.classList.remove('bg-green-600', 'hover:bg-green-700');
            btnDashboard.classList.add('bg-orange-600', 'hover:bg-orange-700');
        }
    }
}

// Carrega o estado das provisões do dia atual ao entrar no jogo
async function carregarEstadoProvisoesParaHoje(userId) {
    const client = getClient();
    if (!client) return;

    try {
        const { inicio, fim } = getHojeIntervalo();
        const { data, error } = await client
            .from('atividades')
            .select('nome_tarefa, categoria, data_completada')
            .eq('user_id', userId)
            .eq('categoria', 'provisao')
            .gte('data_completada', inicio)
            .lte('data_completada', fim);

        if (error) {
            // Log detalhado para o Logcat (JSON.stringify evita [object Object])
            console.error('[carregarEstadoProvisoesParaHoje] Erro ao buscar atividades (provisões):', JSON.stringify(error, null, 2));
            return;
        }

        if (data && Array.isArray(data)) {
            data.forEach(row => {
                const tipo = row.nome_tarefa;
                if (tipo && PROVISOES_CONFIG[tipo]) {
                    // Se existe registro em atividades hoje, consideramos concluída
                    atualizarEstadoProvisaoUI(tipo, true);
                }
            });
        }
    } catch (err) {
        console.error('[carregarEstadoProvisoesParaHoje] Erro inesperado:', err);
    }
}

// Marcar / Desfazer refeição (toggle seguro)
window.marcarRefeicao = async function(tipo) {
    console.log(`[marcarRefeicao] Clique recebido para tipo: ${tipo}`);

    const cfg = PROVISOES_CONFIG[tipo];
    if (!cfg) {
        console.warn('[marcarRefeicao] Tipo de provisão desconhecido:', tipo);
        return;
    }

    // Debounce de 1 segundo por tipo
    const agora = Date.now();
    if (provisoesUltimoClique[tipo] && (agora - provisoesUltimoClique[tipo] < PROVISOES_DEBOUNCE_MS)) {
        console.warn('[marcarRefeicao] Clique ignorado por debounce (muito rápido).');
        return;
    }
    provisoesUltimoClique[tipo] = agora;

    const client = getClient();
    if (!client) {
        console.error('[marcarRefeicao] Supabase não inicializado');
        return;
    }

    try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            console.error('[marcarRefeicao] Usuário não autenticado');
            return;
        }

        const { inicio, fim } = getHojeIntervalo();

        // 1) Verificar estado atual em 'atividades' (categoria 'provisao')
        const { data: atividadesHoje, error: erroAtividadesHoje } = await client
            .from('atividades')
            .select('id, nome_tarefa, data_completada')
            .eq('user_id', user.id)
            .eq('categoria', 'provisao')
            .eq('nome_tarefa', tipo)
            .gte('data_completada', inicio)
            .lte('data_completada', fim)
            .order('data_completada', { ascending: false })
            .limit(1);

        if (erroAtividadesHoje && erroAtividadesHoje.code !== 'PGRST116') {
            console.error('[marcarRefeicao] Erro ao consultar atividades:', JSON.stringify(erroAtividadesHoje, null, 2));
            return;
        }

        const atividadeHoje = (atividadesHoje && atividadesHoje.length > 0) ? atividadesHoje[0] : null;
        const jaConcluidaHoje = !!atividadeHoje;
        const marcando = !jaConcluidaHoje; // true = marcar, false = desfazer

        console.log('[marcarRefeicao] Estado atual:', { tipo, jaConcluidaHoje, marcando });

        // 2) Calcular deltas de XP/Vitalidade
        const deltaXp = marcando ? cfg.xp : -cfg.xp;
        const deltaVit = marcando ? cfg.vitalidade : -cfg.vitalidade;

        // 3) Obter personagem atual para aplicar deltas
        let personagem = window.personagemData;
        if (!personagem) {
            const { data: personagemDb, error: errPers } = await client
                .from('personagens')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (errPers) {
                console.error('[marcarRefeicao] Erro ao buscar personagem para aplicar deltas:', errPers);
                return;
            }
            personagem = personagemDb;
            window.personagemData = personagemDb;
        }

        const xpAtual = personagem.experiencia ?? personagem.xp ?? 0;
        const vitalidadeAtual = personagem.vitalidade ?? 0;

        const novoXp = Math.max(0, xpAtual + deltaXp);
        const novaVitalidade = Math.max(0, vitalidadeAtual + deltaVit);

        console.log('[marcarRefeicao] Aplicando deltas:', JSON.stringify({
            tipo,
            marcando,
            xpAtual,
            vitalidadeAtual,
            deltaXp,
            deltaVit,
            novoXp,
            novaVitalidade
        }, null, 2));

        // 4) Executar operações no Supabase
        // OBS: Idealmente essa parte deveria ir para uma função RPC em SQL para ficar 100% transacional.

        // 4.1) Atualizar personagem (XP + Vitalidade se existir a coluna)
        const updatePayload = {
            experiencia: novoXp
        };
        // Só tenta atualizar vitalidade se essa coluna existir no objeto retornado
        if (Object.prototype.hasOwnProperty.call(personagem, 'vitalidade')) {
            updatePayload.vitalidade = novaVitalidade;
        }

        const { error: erroUpdatePers } = await client
            .from('personagens')
            .update(updatePayload)
            .eq('user_id', user.id);

        if (erroUpdatePers) {
            console.error('[marcarRefeicao] Erro ao atualizar personagem:', JSON.stringify(erroUpdatePers, null, 2));
            return;
        }

        // Atualiza cache local
        window.personagemData = {
            ...personagem,
            experiencia: novoXp,
            // Só atualiza vitalidade no cache se essa propriedade existir
            ...(Object.prototype.hasOwnProperty.call(personagem, 'vitalidade')
                ? { vitalidade: novaVitalidade }
                : {})
        };

        // 4.2) Registrar / remover linha em 'atividades' (status diário)
        let erroAtiv = null;
        let atividadeIdInserida = null;
        
        if (marcando) {
            const payloadAtividade = {
                user_id: user.id,
                nome_tarefa: tipo,
                pontuacao: cfg.xp,
                data_completada: new Date().toISOString(),
                regiao: 'provisao',
                categoria: 'provisao',
                tipo_logica: 'recorrente',
                complexidade: 1,
                dados_extras: {
                    origem: 'dashboard_provisoes',
                    tipo
                }
            };

            const { data: atividadeInserida, error } = await client
                .from('atividades')
                .insert([payloadAtividade])
                .select('id')
                .single();
            
            erroAtiv = error;
            if (!error && atividadeInserida) {
                atividadeIdInserida = atividadeInserida.id;
            }
        } else if (atividadeHoje && atividadeHoje.id) {
            const { error } = await client
                .from('atividades')
                .delete()
                .eq('id', atividadeHoje.id);
            erroAtiv = error;
        }

        if (erroAtiv) {
            console.error('[marcarRefeicao] Erro ao atualizar atividades:', erroAtiv);
            return;
        }

        // 4.3) Registrar no histórico (apenas quando marcando)
        if (marcando) {
            // Se não temos ID da atividade inserida, busca uma existente
            if (!atividadeIdInserida) {
                const { data: atividadeExistente } = await client
                    .from('atividades')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('nome_tarefa', tipo)
                    .eq('categoria', 'provisao')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (atividadeExistente) {
                    atividadeIdInserida = atividadeExistente.id;
                }
            }
            
            // Se ainda não temos ID, cria uma atividade temporária apenas para o histórico
            if (!atividadeIdInserida) {
                const { data: atividadeTemp, error: erroTemp } = await client
                    .from('atividades')
                    .insert([{
                        user_id: user.id,
                        nome_tarefa: tipo,
                        pontuacao: cfg.xp,
                        categoria: 'provisao',
                        tipo_logica: 'recorrente',
                        complexidade: 1
                    }])
                    .select('id')
                    .single();
                
                if (!erroTemp && atividadeTemp) {
                    atividadeIdInserida = atividadeTemp.id;
                }
            }
            
            if (atividadeIdInserida) {
                const payloadHistorico = {
                    user_id: user.id,
                    missao_id: atividadeIdInserida,
                    nome_missao: tipo,
                    tipo_missao: 'provisao_refeicao',
                    categoria: 'provisao',
                    recompensa: cfg.xp,
                    origem: 'dashboard_provisoes',
                    data_completada: new Date().toISOString(),
                    progresso: 100,
                    tempo_decorrido: 0
                };

                const { error: erroHist } = await client
                    .from('historico_atividades')
                    .insert([payloadHistorico]);

                if (erroHist) {
                    console.error('[marcarRefeicao] Erro ao inserir em historico_atividades:', JSON.stringify(erroHist, null, 2));
                    // Não retorna aqui para não reverter visualmente algo que conceptualmente aconteceu
                }
            } else {
                console.warn('[marcarRefeicao] Não foi possível obter ID da atividade para o histórico');
            }
        } else {
            // Desfazer: só permitido no dia atual -> removemos o registro mais recente de hoje
            const { inicio, fim } = getHojeIntervalo();
            const { data: hist, error: erroHistSel } = await client
                .from('historico_atividades')
                .select('id')
                .eq('user_id', user.id)
                .eq('categoria', 'provisao')
                .eq('tipo_missao', 'provisao_refeicao')
                .eq('nome_missao', tipo)
                .gte('data_completada', inicio)
                .lte('data_completada', fim)
                .order('data_completada', { ascending: false })
                .limit(1);

            if (!erroHistSel && hist && hist.length > 0) {
                const { error: erroDel } = await client
                    .from('historico_atividades')
                    .delete()
                    .eq('id', hist[0].id);

                if (erroDel) {
                    console.error('[marcarRefeicao] Erro ao remover do historico_atividades:', erroDel);
                }
            } else if (erroHistSel) {
                console.error('[marcarRefeicao] Erro ao buscar histórico para desfazer:', erroHistSel);
            }
        }

        // 5) Atualizar UI (botões + header + XP)
        atualizarEstadoProvisaoUI(tipo, marcando);

        // Atualizar XP na UI
        const xpDisplayEl = document.getElementById('xpDisplay');
        const xpBarEl = document.getElementById('xpBar');
        if (xpDisplayEl) {
            xpDisplayEl.textContent = `${novoXp} XP`;
        }
        if (xpBarEl) {
            const xpNecessario = 100;
            const xpAtualNivel = novoXp % xpNecessario;
            const porcentagem = (xpAtualNivel / xpNecessario) * 100;
            xpBarEl.style.width = `${Math.min(porcentagem, 100)}%`;
        }

        console.log(`✅ [marcarRefeicao] Provisão ${tipo} ${marcando ? 'marcada' : 'desfeita'} com sucesso.`);
    } catch (error) {
        console.error('[marcarRefeicao] Erro ao processar provisão:', error);
    }
};

// ============================================
// SISTEMA UNIFICADO DE ALTERNAR ATIVIDADE (TOGGLE)
// ============================================

// Controle de debounce por ID de atividade
const atividadesUltimoClique = {};
const ATIVIDADES_DEBOUNCE_MS = 1000;

/**
 * Função unificada para alternar (marcar/desfazer) uma atividade
 * @param {string} atividadeId - ID da atividade na tabela 'atividades'
 * @returns {Promise<Object>} Resultado da operação
 */
window.alternarAtividade = async function(atividadeId) {
    console.log(`[alternarAtividade] Clique recebido para atividade ID: ${atividadeId}`);

    if (!atividadeId) {
        console.error('[alternarAtividade] ID da atividade não fornecido');
        return { sucesso: false, erro: 'ID da atividade não fornecido' };
    }

    // Debounce: evita múltiplos cliques rápidos
    const agora = Date.now();
    if (atividadesUltimoClique[atividadeId] && 
        (agora - atividadesUltimoClique[atividadeId] < ATIVIDADES_DEBOUNCE_MS)) {
        console.warn('[alternarAtividade] Clique ignorado por debounce (muito rápido)');
        return { sucesso: false, erro: 'Aguarde antes de clicar novamente' };
    }
    atividadesUltimoClique[atividadeId] = agora;

    const client = getClient();
    if (!client) {
        console.error('[alternarAtividade] Supabase não inicializado');
        return { sucesso: false, erro: 'Supabase não inicializado' };
    }

    try {
        // Verifica autenticação
        const { data: { user }, error: erroAuth } = await client.auth.getUser();
        if (erroAuth || !user) {
            console.error('[alternarAtividade] Usuário não autenticado:', erroAuth);
            return { sucesso: false, erro: 'Usuário não autenticado' };
        }

        // Converte o ID para o formato correto (UUID ou mantém como está)
        // Se for um número, tenta converter para UUID ou usa como TEXT
        let atividadeIdFormatado = atividadeId;
        
        // Log detalhado antes de chamar a RPC
        console.log('🔍 [alternarAtividade] DEBUG - Antes de chamar RPC:');
        console.log('   - atividadeId original:', atividadeId);
        console.log('   - atividadeId tipo:', typeof atividadeId);
        console.log('   - atividadeId formatado:', atividadeIdFormatado);
        console.log('   - user.id:', user.id);
        console.log('   - user.id tipo:', typeof user.id);
        
        // Validação adicional do ID
        if (!atividadeIdFormatado || atividadeIdFormatado === 'null' || atividadeIdFormatado === 'undefined') {
            console.error('❌ [alternarAtividade] ID da atividade inválido após formatação:', atividadeIdFormatado);
            return { sucesso: false, erro: 'ID da atividade inválido' };
        }
        
        // Converte para string para garantir que não seja null/undefined
        const idParaEnviar = String(atividadeIdFormatado).trim();
        if (!idParaEnviar || idParaEnviar === 'null' || idParaEnviar === 'undefined') {
            console.error('❌ [alternarAtividade] ID inválido após conversão para string:', idParaEnviar);
            return { sucesso: false, erro: 'ID da atividade inválido após conversão' };
        }
        
        // Dados antes do RPC - conforme solicitado
        console.log('📋 [alternarAtividade] Dados antes do RPC:', {
            id: idParaEnviar,
            id_tipo: typeof idParaEnviar,
            user_id: user.id,
            user_id_tipo: typeof user.id
        });
        
        // Chama a função RPC no Supabase (garante atomicidade)
        // IMPORTANTE: A função RPC aceita apenas p_atividade_id e p_user_id
        // Ela busca a atividade pelo ID e pega os dados dela internamente
        console.log('📤 [alternarAtividade] Chamando RPC com parâmetros EXATOS:', {
            p_atividade_id: idParaEnviar,
            p_user_id: user.id
        });
        
        const { data: resultado, error: erroRpc } = await client.rpc('alternar_atividade', {
            p_atividade_id: idParaEnviar,
            p_user_id: user.id
        });

        if (erroRpc) {
            console.error('[alternarAtividade] Erro ao chamar RPC:', JSON.stringify(erroRpc, null, 2));
            const mensagemErro = erroRpc.message || erroRpc.details || 'Erro ao processar atividade';
            
            // Feedback visual de erro
            alert(`❌ Erro: ${mensagemErro}\n\nVerifique:\n- Se a função RPC "alternar_atividade" existe no Supabase\n- Se o ID da atividade é válido\n- Se você está autenticado`);
            
            return { sucesso: false, erro: mensagemErro };
        }

        if (!resultado || !resultado.sucesso) {
            console.error('[alternarAtividade] RPC retornou erro:', resultado);
            const mensagemErro = resultado?.erro || resultado?.message || 'Erro desconhecido';
            
            // Feedback visual de erro
            alert(`❌ Erro: ${mensagemErro}`);
            
            return { sucesso: false, erro: mensagemErro };
        }

        console.log('[alternarAtividade] Resultado:', JSON.stringify(resultado, null, 2));

        // Atualiza cache local do personagem
        if (window.personagemData) {
            window.personagemData = {
                ...window.personagemData,
                experiencia: resultado.xp_final,
                xp: resultado.xp_final,
                vitalidade: resultado.vitalidade_final,
                mana: resultado.mana_final
            };
        }

        // Atualiza UI de XP
        const xpDisplayEl = document.getElementById('xpDisplay');
        const xpBarEl = document.getElementById('xpBar');
        if (xpDisplayEl) {
            xpDisplayEl.textContent = `${resultado.xp_final} XP`;
        }
        if (xpBarEl) {
            const xpNecessario = 100;
            const xpAtualNivel = resultado.xp_final % xpNecessario;
            const porcentagem = (xpAtualNivel / xpNecessario) * 100;
            xpBarEl.style.width = `${Math.min(porcentagem, 100)}%`;
        }

        // Atualiza UI de atributos (se existirem elementos)
        const vitalidadeEl = document.getElementById('vitalidadeDisplay');
        const manaEl = document.getElementById('manaDisplay');
        if (vitalidadeEl) {
            vitalidadeEl.textContent = `${resultado.vitalidade_final} HP`;
        }
        if (manaEl) {
            manaEl.textContent = `${resultado.mana_final} MP`;
        }

        // Atualiza os rostos (HP/Mana) visualmente
        if (typeof window.atualizarRostos === 'function') {
            window.atualizarRostos(
                resultado.vitalidade_final || 0,
                resultado.mana_final || 0
            );
        }

        // Verifica buffs ativos para atualizar animações
        if (typeof window.verificarBuffsAtivos === 'function') {
            window.verificarBuffsAtivos();
        }

        // Feedback visual
        const acao = resultado.acao === 'marcado' ? 'marcada' : 'desfeita';
        console.log(`✅ [alternarAtividade] Atividade ${acao} com sucesso.`);
        
        if (resultado.buff_aplicado) {
            console.log(`🎁 [alternarAtividade] Buff de Impulso aplicado! Multiplicador: ${resultado.multiplicador_buff}x`);
        }

        // Recarrega a lista de missões para atualizar o estado visual dos cards
        const conteudoRotina = document.getElementById('conteudo-rotina');
        const conteudoJornada = document.getElementById('conteudo-jornada');
        
        if (conteudoRotina && !conteudoRotina.classList.contains('hidden')) {
            // Se está na aba Rotina, recarrega
            setTimeout(() => {
                if (typeof carregarMissoesRotina === 'function') {
                    carregarMissoesRotina().catch(err => {
                        console.error('[alternarAtividade] Erro ao recarregar missões da rotina:', err);
                    });
                }
            }, 500);
        } else if (conteudoJornada && !conteudoJornada.classList.contains('hidden')) {
            // Se está na aba Jornada, recarrega
            setTimeout(() => {
                if (typeof carregarMissoesJornada === 'function') {
                    carregarMissoesJornada().catch(err => {
                        console.error('[alternarAtividade] Erro ao recarregar missões da jornada:', err);
                    });
                }
            }, 500);
        }

        // Retorna resultado para possível uso futuro
        return {
            sucesso: true,
            acao: resultado.acao,
            xp_final: resultado.xp_final,
            vitalidade_final: resultado.vitalidade_final,
            mana_final: resultado.mana_final,
            buff_aplicado: resultado.buff_aplicado || false,
            multiplicador_buff: resultado.multiplicador_buff || 1.0
        };

    } catch (error) {
        console.error('[alternarAtividade] Erro inesperado:', error);
        const mensagemErro = error.message || 'Erro inesperado';
        
        // Feedback visual de erro
        alert(`❌ Erro inesperado: ${mensagemErro}\n\nVerifique o console para mais detalhes.`);
        
        return { sucesso: false, erro: mensagemErro };
    }
};

// ============================================
// SISTEMA DE TIMER DE FOCO/LIMPEZA
// ============================================

// Variáveis globais do timer
window.focusTimerInterval = null;
window.focusTimerSeconds = 600; // 10 minutos em segundos
window.focusTimerPaused = false;
window.focusTimerRunning = false;

// Expandir timer de foco/limpeza
window.expandFocusTimer = function() {
    console.log('[expandFocusTimer] Expandindo timer de foco');
    const timerExpanded = document.getElementById('focusTimerExpanded');
    if (timerExpanded) {
        timerExpanded.classList.remove('hidden');
    }
    const timerExpandedModal = document.getElementById('focusTimerExpanded-modal');
    if (timerExpandedModal) {
        timerExpandedModal.classList.remove('hidden');
    }
    // Inicia o timer automaticamente quando expandido
    if (!window.focusTimerRunning) {
        window.startFocusTimer();
    }
};

// Colapsar timer de foco/limpeza
window.collapseFocusTimer = function() {
    console.log('[collapseFocusTimer] Colapsando timer de foco');
    const timerExpanded = document.getElementById('focusTimerExpanded');
    if (timerExpanded) {
        timerExpanded.classList.add('hidden');
    }
    const timerExpandedModal = document.getElementById('focusTimerExpanded-modal');
    if (timerExpandedModal) {
        timerExpandedModal.classList.add('hidden');
    }
    // Pausa o timer quando colapsado
    if (window.focusTimerRunning) {
        window.pauseFocusTimer();
    }
};

// Iniciar/Retomar timer de foco
window.startFocusTimer = function() {
    console.log('[startFocusTimer] Iniciando/retomando timer de foco');
    window.focusTimerRunning = true;
    window.focusTimerPaused = false;
    
    // Atualiza botões
    const pauseBtn = document.getElementById('focusPauseBtn');
    const resumeBtn = document.getElementById('focusResumeBtn');
    const pauseBtnModal = document.getElementById('focusPauseBtn-modal');
    const resumeBtnModal = document.getElementById('focusResumeBtn-modal');
    
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    if (pauseBtnModal) pauseBtnModal.classList.remove('hidden');
    if (resumeBtnModal) resumeBtnModal.classList.add('hidden');
    
    // Limpa intervalo anterior se existir
    if (window.focusTimerInterval) {
        clearInterval(window.focusTimerInterval);
    }
    
    // Inicia o contador
    window.focusTimerInterval = setInterval(() => {
        if (!window.focusTimerPaused && window.focusTimerSeconds > 0) {
            window.focusTimerSeconds--;
            window.updateFocusTimerDisplay();
            
            // Quando chegar a zero, finaliza automaticamente
            if (window.focusTimerSeconds === 0) {
                window.finishFocusTimer();
            }
        }
    }, 1000);
    
    window.updateFocusTimerDisplay();
};

// Pausar timer de foco
window.pauseFocusTimer = function() {
    console.log('[pauseFocusTimer] Pausando timer de foco');
    window.focusTimerPaused = true;
    
    // Atualiza botões
    const pauseBtn = document.getElementById('focusPauseBtn');
    const resumeBtn = document.getElementById('focusResumeBtn');
    const pauseBtnModal = document.getElementById('focusPauseBtn-modal');
    const resumeBtnModal = document.getElementById('focusResumeBtn-modal');
    
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (resumeBtn) resumeBtn.classList.remove('hidden');
    if (pauseBtnModal) pauseBtnModal.classList.add('hidden');
    if (resumeBtnModal) resumeBtnModal.classList.remove('hidden');
};

// Finalizar timer de foco
window.finishFocusTimer = async function() {
    console.log('[finishFocusTimer] Finalizando timer de foco');
    window.focusTimerRunning = false;
    window.focusTimerPaused = false;
    
    // Limpa o intervalo
    if (window.focusTimerInterval) {
        clearInterval(window.focusTimerInterval);
        window.focusTimerInterval = null;
    }
    
    // Salva no Supabase que a limpeza foi concluída
    const client = getClient();
    if (client) {
        try {
            const { data: { user } } = await client.auth.getUser();
            if (user) {
                // TODO: Salvar no Supabase quando a tabela de atividades estiver criada
                // const { error } = await client
                //     .from('atividades')
                //     .insert([{
                //         user_id: user.id,
                //         tipo: 'limpeza',
                //         duracao: 600 - window.focusTimerSeconds, // segundos completados
                //         concluida: true,
                //         data: new Date().toISOString()
                //     }]);
                
                console.log('✅ [finishFocusTimer] Limpeza registrada no Supabase');
            }
        } catch (error) {
            console.error('[finishFocusTimer] Erro ao salvar limpeza:', error);
        }
    }
    
    // Reseta o timer para 10 minutos
    window.focusTimerSeconds = 600;
    window.updateFocusTimerDisplay();
    
    // Atualiza botões
    const pauseBtn = document.getElementById('focusPauseBtn');
    const resumeBtn = document.getElementById('focusResumeBtn');
    const pauseBtnModal = document.getElementById('focusPauseBtn-modal');
    const resumeBtnModal = document.getElementById('focusResumeBtn-modal');
    
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    if (pauseBtnModal) pauseBtnModal.classList.remove('hidden');
    if (resumeBtnModal) resumeBtnModal.classList.add('hidden');
    
    console.log('✅ Timer de limpeza finalizado!');
};

// Atualizar display do timer
window.updateFocusTimerDisplay = function() {
    const minutes = Math.floor(window.focusTimerSeconds / 60);
    const seconds = window.focusTimerSeconds % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const display = document.getElementById('focusTimerDisplay');
    const displayModal = document.getElementById('focusTimerDisplay-modal');
    
    if (display) {
        display.textContent = timeString;
    }
    if (displayModal) {
        displayModal.textContent = timeString;
    }
};

// Abrir timer de atividade física
window.abrirTimerAtividadeFisica = function() {
    console.log('[abrirTimerAtividadeFisica] Abrindo timer de atividade física');
    const timerDiv = document.getElementById('atividade-fisica-timer');
    const inicioDiv = document.getElementById('atividade-fisica-inicio');
    if (timerDiv && inicioDiv) {
        timerDiv.classList.remove('hidden');
        inicioDiv.classList.add('hidden');
    }
    // Também no modal
    const timerModal = document.getElementById('atividade-fisica-timer-modal');
    const inicioModal = document.getElementById('atividade-fisica-inicio-modal');
    if (timerModal && inicioModal) {
        timerModal.classList.remove('hidden');
        inicioModal.classList.add('hidden');
    }
};

// Iniciar atividade física
window.iniciarAtividadeFisica = function() {
    console.log('[iniciarAtividadeFisica] Iniciando atividade física');
    // Abre o timer no modal
    const timerModal = document.getElementById('atividade-fisica-timer-modal');
    const inicioModal = document.getElementById('atividade-fisica-inicio-modal');
    if (timerModal && inicioModal) {
        timerModal.classList.remove('hidden');
        inicioModal.classList.add('hidden');
    }
    // Abre o timer no dashboard
    const timerDiv = document.getElementById('atividade-fisica-timer');
    const inicioDiv = document.getElementById('atividade-fisica-inicio');
    if (timerDiv && inicioDiv) {
        timerDiv.classList.remove('hidden');
        inicioDiv.classList.add('hidden');
    }
    // TODO: Implementar lógica do timer de atividade física (contador, etc)
};

// Pausar atividade física
window.pausarAtividadeFisica = function() {
    console.log('[pausarAtividadeFisica] Pausando atividade física');
    // TODO: Implementar lógica de pausa
};

// Finalizar atividade física
window.finalizarAtividadeFisica = async function() {
    console.log('[finalizarAtividadeFisica] Finalizando atividade física');
    
    const client = getClient();
    if (client) {
        try {
            const { data: { user } } = await client.auth.getUser();
            if (user) {
                // TODO: Salvar no Supabase quando a tabela de atividades estiver criada
                // const { error } = await client
                //     .from('atividades')
                //     .insert([{
                //         user_id: user.id,
                //         tipo: 'atividade_fisica',
                //         duracao: 1800, // 30 minutos em segundos
                //         concluida: true,
                //         data: new Date().toISOString()
                //     }]);
                
                console.log('✅ [finalizarAtividadeFisica] Atividade física registrada no Supabase');
            }
        } catch (error) {
            console.error('[finalizarAtividadeFisica] Erro ao salvar atividade:', error);
        }
    }
    
    // Fecha o timer e reseta
    const timerDiv = document.getElementById('atividade-fisica-timer');
    const inicioDiv = document.getElementById('atividade-fisica-inicio');
    if (timerDiv && inicioDiv) {
        timerDiv.classList.add('hidden');
        inicioDiv.classList.remove('hidden');
    }
    
    const timerModal = document.getElementById('atividade-fisica-timer-modal');
    const inicioModal = document.getElementById('atividade-fisica-inicio-modal');
    if (timerModal && inicioModal) {
        timerModal.classList.add('hidden');
        inicioModal.classList.remove('hidden');
    }
};

// Abrir modal de missão
window.openAddMissionModal = function() {
    console.log('[openAddMissionModal] Abrindo modal de missão');
    // TODO: Implementar abertura do modal
};

// Alternar escudo de compromisso
window.alternarEscudoCompromisso = function() {
    console.log('[alternarEscudoCompromisso] Alternando escudo de compromisso');
    // TODO: Implementar lógica do escudo
};

// Ativar escudo de recuperação
window.ativarEscudoRecuperacao = function() {
    console.log('[ativarEscudoRecuperacao] Ativando escudo de recuperação');
    // TODO: Implementar lógica do escudo
};

// Ver agenda
window.verAgenda = function() {
    console.log('[verAgenda] Abrindo agenda');
    // TODO: Implementar visualização da agenda
};

// Adicionar água instantaneamente
window.addWaterInstant = async function() {
    console.log('[addWaterInstant] Adicionando água');
    
    const client = getClient();
    if (!client) {
        console.error('[addWaterInstant] Supabase não inicializado');
        return;
    }
    
    try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            console.error('[addWaterInstant] Usuário não autenticado');
            return;
        }
        
        // TODO: Salvar no Supabase quando a tabela de água estiver criada
        // const { error } = await client
        //     .from('agua')
        //     .insert([{
        //         user_id: user.id,
        //         quantidade: 250, // ml
        //         data: new Date().toISOString()
        //     }]);
        
        // Atualiza visualmente o círculo de progresso
        const circle = document.getElementById('status-water-circle');
        if (circle) {
            // TODO: Calcular progresso baseado na meta diária
            // Por enquanto, apenas anima o círculo
            const currentOffset = parseFloat(circle.style.strokeDashoffset) || 144.5;
            const newOffset = Math.max(0, currentOffset - 36.125); // 25% do círculo (250ml de 1000ml)
            circle.style.strokeDashoffset = newOffset;
        }
        
        console.log('✅ [addWaterInstant] Água adicionada com sucesso');
    } catch (error) {
        console.error('[addWaterInstant] Erro ao adicionar água:', error);
    }
};

// Abrir configurações de água
window.openWaterSettings = function() {
    console.log('[openWaterSettings] Abrindo configurações de água');
    const waterModal = document.getElementById('waterModal');
    if (waterModal) {
        waterModal.classList.remove('hidden');
    }
};

/**
 * Adiciona água e atualiza a barra de progresso
 * @param {number} quantidade - Quantidade em ml (ex: 250, 500)
 */
window.adicionarAgua = async function(quantidade = 250) {
    console.log(`💧 [adicionarAgua] Adicionando ${quantidade}ml de água`);
    
    // Chama a função existente para adicionar água
    await window.addWaterInstant();
    
    // Atualiza o widget de água na página de missões
    atualizarWidgetAgua(quantidade);
};

/**
 * Atualiza o widget de água com o progresso
 * @param {number} quantidadeAdicionada - Quantidade adicionada em ml
 */
function atualizarWidgetAgua(quantidadeAdicionada = 0) {
    // Meta diária padrão (pode ser configurável)
    const metaDiaria = 2000; // ml
    
    // Busca o valor atual do localStorage ou usa 0
    const aguaAtual = parseInt(localStorage.getItem('aguaConsumidaHoje') || '0');
    const novaQuantidade = aguaAtual + quantidadeAdicionada;
    
    // Salva no localStorage
    localStorage.setItem('aguaConsumidaHoje', novaQuantidade.toString());
    
    // Calcula porcentagem
    const porcentagem = Math.min(100, (novaQuantidade / metaDiaria) * 100);
    
    // Atualiza elementos do widget
    const progressoTexto = document.getElementById('agua-progresso-texto');
    const porcentagemEl = document.getElementById('agua-porcentagem');
    const progressoBarra = document.getElementById('agua-progresso-barra');
    const progressoEmoji = document.getElementById('agua-progresso-emoji');
    
    if (progressoTexto) {
        progressoTexto.textContent = `${novaQuantidade} / ${metaDiaria} ml`;
    }
    
    if (porcentagemEl) {
        porcentagemEl.textContent = `${Math.round(porcentagem)}%`;
    }
    
    if (progressoBarra) {
        progressoBarra.style.width = `${porcentagem}%`;
        
        // Mostra emoji quando há progresso
        if (progressoEmoji && porcentagem > 0) {
            progressoEmoji.style.opacity = '1';
        }
        
        // Muda cor da barra baseado no progresso
        if (porcentagem >= 100) {
            progressoBarra.classList.remove('bg-blue-500');
            progressoBarra.classList.add('bg-green-500');
        } else if (porcentagem >= 75) {
            progressoBarra.classList.remove('bg-green-500', 'bg-blue-500');
            progressoBarra.classList.add('bg-blue-400');
        } else {
            progressoBarra.classList.remove('bg-green-500', 'bg-blue-400');
            progressoBarra.classList.add('bg-blue-500');
        }
    }
    
    console.log(`✅ [atualizarWidgetAgua] Progresso atualizado: ${novaQuantidade}ml (${Math.round(porcentagem)}%)`);
}

/**
 * Carrega o estado atual do widget de água ao abrir a página
 */
function carregarEstadoAgua() {
    const aguaAtual = parseInt(localStorage.getItem('aguaConsumidaHoje') || '0');
    if (aguaAtual > 0) {
        atualizarWidgetAgua(0); // Atualiza sem adicionar mais água
    }
}

// Carrega o estado quando a página de missões é aberta
(function() {
    // Observa quando a página de missões é aberta
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const missionsPage = document.getElementById('missions-page');
                if (missionsPage && !missionsPage.classList.contains('hidden')) {
                    // Página de missões foi aberta, carrega estado da água
                    setTimeout(() => {
                        carregarEstadoAgua();
                    }, 100);
                }
            }
        });
    });
    
    // Inicia observer quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const missionsPage = document.getElementById('missions-page');
            if (missionsPage) {
                observer.observe(missionsPage, { attributes: true, attributeFilter: ['class'] });
            }
        });
    } else {
        const missionsPage = document.getElementById('missions-page');
        if (missionsPage) {
            observer.observe(missionsPage, { attributes: true, attributeFilter: ['class'] });
        }
    }
})();

// ============================================
// SISTEMA DE ABAS DE MISSÕES
// ============================================

/**
 * Troca entre as abas de missões (Rotina/Jornada)
 * @param {string} aba - 'rotina' ou 'jornada'
 */
window.trocarAbaMissao = function(aba) {
    const timestamp = new Date().toISOString();
    console.log(`🔄 [${timestamp}] [trocarAbaMissao] CLIQUE DETECTADO - Tentando trocar para aba: "${aba}"`);
    
    try {
        // Validação do parâmetro
        if (!aba || (aba !== 'rotina' && aba !== 'jornada')) {
            console.error(`❌ [trocarAbaMissao] FALHA: Aba inválida recebida:`, aba);
            console.error(`   Esperado: 'rotina' ou 'jornada'`);
            console.error(`   Recebido:`, typeof aba, aba);
            return false;
        }
        
        console.log(`✅ [trocarAbaMissao] Parâmetro válido: "${aba}"`);
        
        // Busca elementos
        const abaRotina = document.getElementById('aba-rotina');
        const abaJornada = document.getElementById('aba-jornada');
        const conteudoRotina = document.getElementById('conteudo-rotina');
        const conteudoJornada = document.getElementById('conteudo-jornada');
        
        // Verifica se elementos existem
        const elementosEncontrados = {
            abaRotina: !!abaRotina,
            abaJornada: !!abaJornada,
            conteudoRotina: !!conteudoRotina,
            conteudoJornada: !!conteudoJornada
        };
        
        console.log(`🔍 [trocarAbaMissao] Elementos encontrados:`, elementosEncontrados);
        
        if (!abaRotina || !abaJornada || !conteudoRotina || !conteudoJornada) {
            console.error(`❌ [trocarAbaMissao] FALHA: Elementos das abas não encontrados`);
            console.error(`   Elementos faltando:`, Object.entries(elementosEncontrados)
                .filter(([_, encontrado]) => !encontrado)
                .map(([nome]) => nome));
            return false;
        }
        
        console.log(`✅ [trocarAbaMissao] Todos os elementos encontrados`);
        
        // Estado antes da mudança
        const estadoAntes = {
            rotinaVisivel: !conteudoRotina.classList.contains('hidden'),
            jornadaVisivel: !conteudoJornada.classList.contains('hidden'),
            rotinaAtiva: abaRotina.classList.contains('border-indigo-500'),
            jornadaAtiva: abaJornada.classList.contains('border-indigo-500')
        };
        console.log(`📊 [trocarAbaMissao] Estado ANTES:`, estadoAntes);
        
        if (aba === 'rotina') {
            console.log(`🔄 [trocarAbaMissao] Ativando aba ROTINA...`);
            
            // Ativa aba Rotina
            abaRotina.classList.add('border-indigo-500', 'text-indigo-400');
            abaRotina.classList.remove('border-transparent', 'text-gray-400');
            abaJornada.classList.remove('border-indigo-500', 'text-indigo-400');
            abaJornada.classList.add('border-transparent', 'text-gray-400');
            conteudoRotina.classList.remove('hidden');
            conteudoJornada.classList.add('hidden');
            
            // Verifica se a mudança foi aplicada
            const estadoDepois = {
                rotinaVisivel: !conteudoRotina.classList.contains('hidden'),
                jornadaVisivel: !conteudoJornada.classList.contains('hidden'),
                rotinaAtiva: abaRotina.classList.contains('border-indigo-500'),
                jornadaAtiva: abaJornada.classList.contains('border-indigo-500')
            };
            console.log(`📊 [trocarAbaMissao] Estado DEPOIS:`, estadoDepois);
            
            if (estadoDepois.rotinaVisivel && !estadoDepois.jornadaVisivel && estadoDepois.rotinaAtiva) {
                console.log(`✅ [trocarAbaMissao] Aba ROTINA ativada com sucesso!`);
            } else {
                console.error(`❌ [trocarAbaMissao] FALHA: Aba ROTINA não foi ativada corretamente`);
                console.error(`   Estado esperado: rotinaVisivel=true, jornadaVisivel=false, rotinaAtiva=true`);
                console.error(`   Estado atual:`, estadoDepois);
            }
            
            // Carrega missões da rotina de forma assíncrona para não bloquear
            setTimeout(() => {
                console.log(`📥 [trocarAbaMissao] Iniciando carregamento de missões da rotina...`);
                carregarMissoesRotina().catch(err => {
                    console.error(`❌ [trocarAbaMissao] Erro ao carregar missões da rotina:`, err);
                });
            }, 50);
            
        } else if (aba === 'jornada') {
            console.log(`🔄 [trocarAbaMissao] Ativando aba JORNADA...`);
            
            // Ativa aba Jornada
            abaJornada.classList.add('border-indigo-500', 'text-indigo-400');
            abaJornada.classList.remove('border-transparent', 'text-gray-400');
            abaRotina.classList.remove('border-indigo-500', 'text-indigo-400');
            abaRotina.classList.add('border-transparent', 'text-gray-400');
            conteudoJornada.classList.remove('hidden');
            conteudoRotina.classList.add('hidden');
            
            // Verifica se a mudança foi aplicada
            const estadoDepois = {
                rotinaVisivel: !conteudoRotina.classList.contains('hidden'),
                jornadaVisivel: !conteudoJornada.classList.contains('hidden'),
                rotinaAtiva: abaRotina.classList.contains('border-indigo-500'),
                jornadaAtiva: abaJornada.classList.contains('border-indigo-500')
            };
            console.log(`📊 [trocarAbaMissao] Estado DEPOIS:`, estadoDepois);
            
            if (estadoDepois.jornadaVisivel && !estadoDepois.rotinaVisivel && estadoDepois.jornadaAtiva) {
                console.log(`✅ [trocarAbaMissao] Aba JORNADA ativada com sucesso!`);
            } else {
                console.error(`❌ [trocarAbaMissao] FALHA: Aba JORNADA não foi ativada corretamente`);
                console.error(`   Estado esperado: jornadaVisivel=true, rotinaVisivel=false, jornadaAtiva=true`);
                console.error(`   Estado atual:`, estadoDepois);
            }
            
            // Carrega missões da jornada de forma assíncrona para não bloquear
            setTimeout(() => {
                console.log(`📥 [trocarAbaMissao] Iniciando carregamento de missões da jornada...`);
                carregarMissoesJornada().catch(err => {
                    console.error(`❌ [trocarAbaMissao] Erro ao carregar missões da jornada:`, err);
                });
            }, 50);
        }
        
        console.log(`✅ [trocarAbaMissao] Operação concluída para aba: "${aba}"`);
        return true;
        
    } catch (error) {
        console.error(`❌ [trocarAbaMissao] ERRO INESPERADO:`, error);
        console.error(`   Stack:`, error.stack);
        return false;
    }
};

/**
 * Carrega missões da rotina (tipo_logica === 'recorrente')
 */
async function carregarMissoesRotina() {
    const timestamp = new Date().toISOString();
    console.log(`📥 [${timestamp}] [carregarMissoesRotina] INICIANDO carregamento de missões da rotina...`);
    
    try {
        const client = getClient();
        if (!client) {
            console.error('❌ [carregarMissoesRotina] FALHA: Supabase não inicializado');
            return;
        }
        console.log('✅ [carregarMissoesRotina] Supabase inicializado');
        
        const rotinaContainer = document.getElementById('rotinaContainer');
        const rotinaEmpty = document.getElementById('rotinaEmpty');
        
        if (!rotinaContainer) {
            console.error('❌ [carregarMissoesRotina] FALHA: Container não encontrado');
            return;
        }
        console.log('✅ [carregarMissoesRotina] Container encontrado');
        
        // Mostra loading
        rotinaContainer.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm">Carregando...</div>';
        console.log('⏳ [carregarMissoesRotina] Mostrando estado de carregamento...');
        
        const { data: { user }, error: erroAuth } = await client.auth.getUser();
        if (erroAuth || !user) {
            console.error('❌ [carregarMissoesRotina] FALHA: Erro de autenticação:', erroAuth);
            rotinaContainer.innerHTML = '<div class="text-center py-4 text-red-400 text-sm">Erro ao carregar</div>';
            return;
        }
        console.log('✅ [carregarMissoesRotina] Usuário autenticado:', user.id);
        
        // Busca atividades recorrentes
        console.log('🔍 [carregarMissoesRotina] Buscando atividades recorrentes...');
        const { data: atividades, error } = await client
            .from('atividades')
            .select('id, nome_tarefa, pontuacao, categoria, complexidade, tipo_logica')
            .eq('user_id', user.id)
            .eq('tipo_logica', 'recorrente')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ [carregarMissoesRotina] FALHA: Erro ao buscar atividades:', error);
            rotinaContainer.innerHTML = '<div class="text-center py-4 text-red-400 text-sm">Erro ao buscar atividades</div>';
            return;
        }
        
        console.log(`📊 [carregarMissoesRotina] ${atividades?.length || 0} atividades encontradas`);
        
        // Limpa container
        rotinaContainer.innerHTML = '';
        
        if (!atividades || atividades.length === 0) {
            console.log('ℹ️ [carregarMissoesRotina] Nenhuma atividade encontrada, mostrando estado vazio');
            if (rotinaEmpty) rotinaEmpty.classList.remove('hidden');
            return;
        }
        
        if (rotinaEmpty) rotinaEmpty.classList.add('hidden');
        
        // Renderiza cada atividade
        let cardsCriados = 0;
        atividades.forEach((atividade, index) => {
            try {
                const card = criarCardAtividade(atividade, 'recorrente');
                if (card) {
                    rotinaContainer.appendChild(card);
                    cardsCriados++;
                    console.log(`✅ [carregarMissoesRotina] Card ${index + 1}/${atividades.length} criado: ${atividade.nome_tarefa}`);
                }
            } catch (err) {
                console.error(`❌ [carregarMissoesRotina] Erro ao criar card ${index + 1}:`, err, atividade);
            }
        });
        
        console.log(`✅ [carregarMissoesRotina] CONCLUÍDO: ${cardsCriados} cards criados de ${atividades.length} atividades`);
    } catch (error) {
        console.error('❌ [carregarMissoesRotina] ERRO INESPERADO:', error);
        console.error('   Stack:', error.stack);
        const rotinaContainer = document.getElementById('rotinaContainer');
        if (rotinaContainer) {
            rotinaContainer.innerHTML = '<div class="text-center py-4 text-red-400 text-sm">Erro ao carregar missões</div>';
        }
    }
}

/**
 * Carrega missões da jornada (tipo_logica === 'unica')
 */
async function carregarMissoesJornada() {
    const timestamp = new Date().toISOString();
    console.log(`📥 [${timestamp}] [carregarMissoesJornada] INICIANDO carregamento de missões da jornada...`);
    
    try {
        const client = getClient();
        if (!client) {
            console.error('❌ [carregarMissoesJornada] FALHA: Supabase não inicializado');
            return;
        }
        console.log('✅ [carregarMissoesJornada] Supabase inicializado');
        
        const jornadaContainer = document.getElementById('jornadaContainer');
        const jornadaEmpty = document.getElementById('jornadaEmpty');
        
        if (!jornadaContainer) {
            console.error('❌ [carregarMissoesJornada] FALHA: Container não encontrado');
            return;
        }
        console.log('✅ [carregarMissoesJornada] Container encontrado');
        
        // Mostra loading
        jornadaContainer.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm">Carregando...</div>';
        console.log('⏳ [carregarMissoesJornada] Mostrando estado de carregamento...');
        
        const { data: { user }, error: erroAuth } = await client.auth.getUser();
        if (erroAuth || !user) {
            console.error('❌ [carregarMissoesJornada] FALHA: Erro de autenticação:', erroAuth);
            jornadaContainer.innerHTML = '<div class="text-center py-4 text-red-400 text-sm">Erro ao carregar</div>';
            return;
        }
        console.log('✅ [carregarMissoesJornada] Usuário autenticado:', user.id);
        
        // Busca atividades únicas
        console.log('🔍 [carregarMissoesJornada] Buscando atividades únicas...');
        const { data: atividades, error } = await client
            .from('atividades')
            .select('id, nome_tarefa, pontuacao, categoria, complexidade, tipo_logica')
            .eq('user_id', user.id)
            .eq('tipo_logica', 'unica')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ [carregarMissoesJornada] FALHA: Erro ao buscar atividades:', error);
            jornadaContainer.innerHTML = '<div class="text-center py-4 text-red-400 text-sm">Erro ao buscar atividades</div>';
            return;
        }
        
        console.log(`📊 [carregarMissoesJornada] ${atividades?.length || 0} atividades encontradas`);
        
        // Limpa container
        jornadaContainer.innerHTML = '';
        
        if (!atividades || atividades.length === 0) {
            console.log('ℹ️ [carregarMissoesJornada] Nenhuma atividade encontrada, mostrando estado vazio');
            if (jornadaEmpty) jornadaEmpty.classList.remove('hidden');
            return;
        }
        
        if (jornadaEmpty) jornadaEmpty.classList.add('hidden');
        
        // Renderiza cada atividade
        let cardsCriados = 0;
        atividades.forEach((atividade, index) => {
            try {
                const card = criarCardAtividadeJornada(atividade);
                if (card) {
                    jornadaContainer.appendChild(card);
                    cardsCriados++;
                    console.log(`✅ [carregarMissoesJornada] Card ${index + 1}/${atividades.length} criado: ${atividade.nome_tarefa}`);
                }
            } catch (err) {
                console.error(`❌ [carregarMissoesJornada] Erro ao criar card ${index + 1}:`, err, atividade);
            }
        });
        
        console.log(`✅ [carregarMissoesJornada] CONCLUÍDO: ${cardsCriados} cards criados de ${atividades.length} atividades`);
    } catch (error) {
        console.error('❌ [carregarMissoesJornada] ERRO INESPERADO:', error);
        console.error('   Stack:', error.stack);
        const jornadaContainer = document.getElementById('jornadaContainer');
        if (jornadaContainer) {
            jornadaContainer.innerHTML = '<div class="text-center py-4 text-red-400 text-sm">Erro ao carregar missões</div>';
        }
    }
}

/**
 * Função temporária para criar missões de teste
 * Remove esta função após popular o banco de dados
 */
window.criarMissoesTeste = async function() {
    console.log('🧪 [criarMissoesTeste] Criando missões de teste...');
    
    const client = getClient();
    if (!client) {
        console.error('❌ [criarMissoesTeste] Supabase não inicializado');
        alert('Erro: Supabase não inicializado');
        return;
    }
    
    try {
        const { data: { user }, error: erroAuth } = await client.auth.getUser();
        if (erroAuth || !user) {
            console.error('❌ [criarMissoesTeste] Erro de autenticação:', erroAuth);
            alert('Erro: Usuário não autenticado');
            return;
        }
        
        const missoesTeste = [
            {
                nome_tarefa: 'Beber Água',
                tipo_logica: 'recorrente',
                categoria: 'fisico',
                pontuacao: 5,
                complexidade: 1,
                user_id: user.id
            },
            {
                nome_tarefa: 'Arrumar a Cama',
                tipo_logica: 'recorrente',
                categoria: 'fisico',
                pontuacao: 5,
                complexidade: 1,
                user_id: user.id
            },
            {
                nome_tarefa: 'Meditar 5min',
                tipo_logica: 'recorrente',
                categoria: 'mental',
                pontuacao: 5,
                complexidade: 1,
                user_id: user.id
            }
        ];
        
        // Verifica se já existem atividades de teste para evitar duplicatas
        const { data: atividadesExistentes } = await client
            .from('atividades')
            .select('nome_tarefa')
            .eq('user_id', user.id)
            .in('nome_tarefa', missoesTeste.map(m => m.nome_tarefa));
        
        const nomesExistentes = atividadesExistentes?.map(a => a.nome_tarefa) || [];
        const missoesParaInserir = missoesTeste.filter(m => !nomesExistentes.includes(m.nome_tarefa));
        
        if (missoesParaInserir.length === 0) {
            console.log('ℹ️ [criarMissoesTeste] Todas as missões de teste já existem');
            alert('Todas as missões de teste já foram criadas!');
            return;
        }
        
        const { data, error } = await client
            .from('atividades')
            .insert(missoesParaInserir)
            .select();
        
        if (error) {
            console.error('❌ [criarMissoesTeste] Erro ao inserir missões:', error);
            alert('Erro ao criar missões de teste: ' + error.message);
            return;
        }
        
        console.log('✅ [criarMissoesTeste] Missões criadas com sucesso:', data);
        alert(`${missoesParaInserir.length} missão(ões) de teste criada(s) com sucesso!`);
        
        // Recarrega as abas
        if (typeof carregarMissoesRotina === 'function') {
            await carregarMissoesRotina();
        }
        
    } catch (error) {
        console.error('❌ [criarMissoesTeste] Erro inesperado:', error);
        alert('Erro ao criar missões de teste: ' + error.message);
    }
};

/**
 * Cria um card visual para uma atividade da Rotina (recorrente)
 * @param {Object} atividade - Objeto da atividade
 * @param {string} tipo - 'recorrente' ou 'unica'
 * @returns {HTMLElement} Elemento do card
 */
function criarCardAtividade(atividade, tipo) {
    try {
        if (!atividade || !atividade.id) {
            console.error('❌ [criarCardAtividade] Atividade inválida:', atividade);
            return null;
        }
        
        const card = document.createElement('div');
        card.className = 'bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 hover:border-indigo-500 transition-colors';
        
        const emojiCategoria = {
            'fisico': '💪',
            'mental': '🧠',
            'saude': '❤️',
            'medicamento': '💊',
            'provisao': '🍽️'
        }[atividade.categoria] || '📋';
        
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                    <div class="text-2xl">${emojiCategoria}</div>
                    <div class="flex flex-col flex-1">
                        <h4 class="font-semibold text-sm">${atividade.nome_tarefa || 'Sem nome'}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-gray-400">${atividade.pontuacao || 0} XP</span>
                            ${atividade.complexidade ? `<span class="text-xs text-yellow-400">⭐ ${atividade.complexidade}</span>` : ''}
                        </div>
                    </div>
                </div>
                <button 
                    onclick="(async function() { 
                        const atividadeId = '${atividade.id}';
                        console.log('🖱️ [Card] Botão Completar clicado para atividade:', atividadeId); 
                        console.log('🔍 [Card] Tipo do ID:', typeof atividadeId, 'Valor:', atividadeId);
                        const btn = this;
                        const textoOriginal = btn.textContent;
                        btn.disabled = true;
                        btn.textContent = 'Processando...';
                        try {
                            // Garante que o ID seja uma string válida
                            if (!atividadeId || atividadeId === 'null' || atividadeId === 'undefined') {
                                throw new Error('ID da atividade inválido: ' + atividadeId);
                            }
                            const resultado = await window.alternarAtividade(atividadeId); 
                            if (resultado && resultado.sucesso) { 
                                btn.textContent = resultado.acao === 'marcado' ? 'Desfazer' : 'Completar'; 
                                btn.classList.toggle('bg-green-600', resultado.acao === 'marcado');
                                btn.classList.toggle('bg-indigo-600', resultado.acao !== 'marcado');
                            } else {
                                btn.textContent = textoOriginal;
                            }
                        } catch (err) {
                            console.error('Erro ao processar:', err);
                            btn.textContent = textoOriginal;
                        } finally {
                            btn.disabled = false;
                        }
                    }).call(this);"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                    Completar
                </button>
            </div>
        `;
        
        return card;
    } catch (error) {
        console.error('❌ [criarCardAtividade] Erro ao criar card:', error, atividade);
        return null;
    }
}

/**
 * Cria um card visual para uma atividade da Jornada (missão única)
 * Mostra o bônus que será dado ao completar
 * @param {Object} atividade - Objeto da atividade
 * @returns {HTMLElement} Elemento do card
 */
function criarCardAtividadeJornada(atividade) {
    try {
        if (!atividade || !atividade.id) {
            console.error('❌ [criarCardAtividadeJornada] Atividade inválida:', atividade);
            return null;
        }
        
        const card = document.createElement('div');
        card.className = 'bg-[#1a1a1a] border border-gray-700 rounded-xl p-3 hover:border-indigo-500 transition-colors';
        
        const emojiCategoria = {
            'fisico': '💪',
            'mental': '🧠',
            'saude': '❤️',
            'medicamento': '💊',
            'provisao': '🍽️'
        }[atividade.categoria] || '📋';
        
        // Calcula o bônus que será dado
        const complexidade = atividade.complexidade || 1;
        const multiplicador = 1.0 + (complexidade * 0.1); // 1.1, 1.2, 1.3, 1.4, 1.5
        const percentualBonus = ((multiplicador - 1) * 100).toFixed(0); // 10%, 20%, 30%, 40%, 50%
        
        // Determina qual atributo será afetado pelo buff
        let tipoBonus = 'XP';
        let emojiBonus = '⭐';
        if (atividade.categoria === 'fisico') {
            tipoBonus = 'Vitalidade';
            emojiBonus = '❤️';
        } else if (atividade.categoria === 'mental') {
            tipoBonus = 'Mana';
            emojiBonus = '🧠';
        } else if (atividade.categoria === 'saude') {
            tipoBonus = 'Ambos';
            emojiBonus = '✨';
        }
        
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                    <div class="text-2xl">${emojiCategoria}</div>
                    <div class="flex flex-col flex-1">
                        <h4 class="font-semibold text-sm">${atividade.nome_tarefa || 'Sem nome'}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-gray-400">${atividade.pontuacao || 0} XP</span>
                            ${atividade.complexidade ? `<span class="text-xs text-yellow-400">⭐ ${atividade.complexidade}</span>` : ''}
                        </div>
                        <!-- Bônus que será dado -->
                        <div class="mt-2 px-2 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
                            <div class="flex items-center gap-1 text-xs text-indigo-300">
                                <span>${emojiBonus}</span>
                                <span class="font-semibold">+${percentualBonus}% de ${tipoBonus}</span>
                                <span class="text-gray-400">por 24h</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button 
                    onclick="(async function() { 
                        const atividadeId = '${atividade.id}';
                        console.log('🖱️ [Card Jornada] Botão clicado para atividade:', atividadeId); 
                        console.log('🔍 [Card Jornada] Tipo do ID:', typeof atividadeId, 'Valor:', atividadeId);
                        const btn = this;
                        const textoOriginal = btn.textContent;
                        btn.disabled = true;
                        btn.textContent = 'Processando...';
                        try {
                            // Garante que o ID seja uma string válida
                            if (!atividadeId || atividadeId === 'null' || atividadeId === 'undefined') {
                                throw new Error('ID da atividade inválido: ' + atividadeId);
                            }
                            const resultado = await window.alternarAtividade(atividadeId); 
                            if (resultado && resultado.sucesso) { 
                                btn.textContent = resultado.acao === 'marcado' ? 'Desfazer' : 'Completar'; 
                                btn.classList.toggle('bg-green-600', resultado.acao === 'marcado');
                                btn.classList.toggle('bg-indigo-600', resultado.acao !== 'marcado');
                            } else {
                                btn.textContent = textoOriginal;
                            }
                        } catch (err) {
                            console.error('Erro ao processar:', err);
                            btn.textContent = textoOriginal;
                        } finally {
                            btn.disabled = false;
                        }
                    }).call(this);"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                    Completar
                </button>
            </div>
        `;
        
        return card;
    } catch (error) {
        console.error('❌ [criarCardAtividadeJornada] Erro ao criar card:', error, atividade);
        return null;
    }
}

// Inicializar event listeners para os botões de abas (fallback caso onclick falhe)
function inicializarEventListenersAbas() {
    console.log('🔧 [inicializarEventListenersAbas] Inicializando event listeners para abas...');
    
    const abaRotina = document.getElementById('aba-rotina');
    const abaJornada = document.getElementById('aba-jornada');
    
    if (abaRotina) {
        // Remove listeners antigos se existirem
        abaRotina.removeEventListener('click', handleClickRotina);
        // Adiciona novo listener
        abaRotina.addEventListener('click', handleClickRotina);
        console.log('✅ [inicializarEventListenersAbas] Event listener adicionado ao botão Rotina');
    } else {
        console.warn('⚠️ [inicializarEventListenersAbas] Botão Rotina não encontrado');
    }
    
    if (abaJornada) {
        // Remove listeners antigos se existirem
        abaJornada.removeEventListener('click', handleClickJornada);
        // Adiciona novo listener
        abaJornada.addEventListener('click', handleClickJornada);
        console.log('✅ [inicializarEventListenersAbas] Event listener adicionado ao botão Jornada');
    } else {
        console.warn('⚠️ [inicializarEventListenersAbas] Botão Jornada não encontrado');
    }
}

// Handlers de clique
function handleClickRotina(event) {
    console.log('🖱️ [handleClickRotina] Event listener capturou clique no botão Rotina');
    event.preventDefault();
    event.stopPropagation();
    const resultado = window.trocarAbaMissao('rotina');
    if (!resultado) {
        console.error('❌ [handleClickRotina] Falha ao trocar para aba Rotina');
    }
}

function handleClickJornada(event) {
    console.log('🖱️ [handleClickJornada] Event listener capturou clique no botão Jornada');
    event.preventDefault();
    event.stopPropagation();
    const resultado = window.trocarAbaMissao('jornada');
    if (!resultado) {
        console.error('❌ [handleClickJornada] Falha ao trocar para aba Jornada');
    }
}

// Carregar missões da rotina ao abrir a página de missões
(function() {
    let carregamentoInicial = false;
    
    // Observa mudanças na página de missões
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const missionsPage = document.getElementById('missions-page');
                if (missionsPage && !missionsPage.classList.contains('hidden') && !carregamentoInicial) {
                    carregamentoInicial = true;
                    console.log('📄 [Observer] Página de missões foi aberta, inicializando...');
                    
                    // Inicializa event listeners
                    setTimeout(() => {
                        inicializarEventListenersAbas();
                    }, 100);
                    
                    // Página de missões foi aberta, carrega a aba ativa
                    setTimeout(() => {
                        try {
                            const conteudoRotina = document.getElementById('conteudo-rotina');
                            const conteudoJornada = document.getElementById('conteudo-jornada');
                            
                            if (conteudoRotina && !conteudoRotina.classList.contains('hidden')) {
                                console.log('📥 [Observer] Carregando missões da rotina...');
                                carregarMissoesRotina().catch(err => console.error('Erro ao carregar rotina:', err));
                            } else if (conteudoJornada && !conteudoJornada.classList.contains('hidden')) {
                                console.log('📥 [Observer] Carregando missões da jornada...');
                                carregarMissoesJornada().catch(err => console.error('Erro ao carregar jornada:', err));
                            } else {
                                // Por padrão, carrega rotina
                                console.log('📥 [Observer] Carregando missões da rotina (padrão)...');
                                carregarMissoesRotina().catch(err => console.error('Erro ao carregar rotina:', err));
                            }
                        } catch (err) {
                            console.error('[Observer] Erro ao carregar missões:', err);
                        }
                    }, 200);
                } else if (missionsPage && missionsPage.classList.contains('hidden')) {
                    carregamentoInicial = false;
                }
            }
        });
    });
    
    // Inicia observer quando DOM estiver pronto
    function iniciarObserver() {
        const missionsPage = document.getElementById('missions-page');
        if (missionsPage) {
            observer.observe(missionsPage, { attributes: true, attributeFilter: ['class'] });
            console.log('👁️ [Observer] Observando mudanças na página de missões');
        } else {
            console.warn('⚠️ [Observer] Página de missões não encontrada, tentando novamente...');
            setTimeout(iniciarObserver, 500);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciarObserver);
    } else {
        iniciarObserver();
    }
    
    // Também tenta inicializar listeners quando a página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(inicializarEventListenersAbas, 500);
        });
    } else {
        setTimeout(inicializarEventListenersAbas, 500);
    }
})();

/**
 * Função de diagnóstico: Verifica elementos que podem estar bloqueando cliques
 */
window.diagnosticarBloqueioCliques = function() {
    console.log('🔍 [DIAGNÓSTICO] Verificando elementos que podem bloquear cliques...');
    
    const elementosParaVerificar = [
        'loginScreen',
        'characterCreationScreen',
        'aura-escudo',
        'app-container',
        'dashboard-page',
        'missions-page'
    ];
    
    const resultados = [];
    
    elementosParaVerificar.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            const info = {
                id: id,
                display: styles.display,
                visibility: styles.visibility,
                opacity: styles.opacity,
                pointerEvents: styles.pointerEvents,
                zIndex: styles.zIndex,
                position: styles.position,
                temHidden: el.classList.contains('hidden'),
                visivel: rect.width > 0 && rect.height > 0 && styles.display !== 'none',
                podeBloquear: styles.pointerEvents !== 'none' && 
                             styles.display !== 'none' && 
                             styles.visibility !== 'hidden' &&
                             parseFloat(styles.opacity) > 0
            };
            resultados.push(info);
            
            if (info.podeBloquear && (id === 'loginScreen' || id === 'characterCreationScreen')) {
                console.warn(`⚠️ [DIAGNÓSTICO] ${id} pode estar bloqueando cliques!`, info);
            }
        } else {
            console.log(`ℹ️ [DIAGNÓSTICO] ${id} não encontrado`);
        }
    });
    
    // Verificar elementos com z-index alto
    const todosElementos = document.querySelectorAll('*');
    const elementosZIndexAlto = [];
    todosElementos.forEach(el => {
        const styles = window.getComputedStyle(el);
        const zIndex = parseInt(styles.zIndex);
        if (zIndex > 100 && styles.position !== 'static' && styles.display !== 'none') {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                elementosZIndexAlto.push({
                    id: el.id || 'sem-id',
                    tag: el.tagName,
                    zIndex: zIndex,
                    pointerEvents: styles.pointerEvents,
                    display: styles.display,
                    position: styles.position
                });
            }
        }
    });
    
    console.log('📊 [DIAGNÓSTICO] Resumo:', {
        elementosVerificados: resultados,
        elementosZIndexAlto: elementosZIndexAlto.sort((a, b) => b.zIndex - a.zIndex)
    });
    
    return { elementosVerificados: resultados, elementosZIndexAlto };
};

/**
 * Sistema de Navegação entre Páginas
 * Garante que apenas uma página esteja visível por vez
 */
window.navigationSystem = {
    currentPage: 'dashboard',
    
    navigateTo: function(page) {
        console.log(`🧭 [navigationSystem] Navegando para: ${page}`);
        
        // Lista de todas as páginas
        const pages = ['dashboard', 'missions', 'inventory', 'stats', 'profile'];
        
        // Esconde todas as páginas
        pages.forEach(pageId => {
            const pageElement = document.getElementById(`${pageId}-page`);
            if (pageElement) {
                pageElement.style.display = 'none';
                pageElement.classList.add('hidden');
                pageElement.style.pointerEvents = 'none';
                console.log(`🔒 [navigationSystem] Página ${pageId} oculta`);
            }
        });
        
        // Mostra apenas a página solicitada
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.style.display = 'block';
            targetPage.classList.remove('hidden');
            targetPage.style.pointerEvents = 'auto';
            this.currentPage = page;
            console.log(`✅ [navigationSystem] Página ${page} ativada`);
            
            // Atualiza botões de navegação
            document.querySelectorAll('.nav-bottom-btn').forEach(btn => {
                const btnPage = btn.getAttribute('data-page');
                if (btnPage === page) {
                    btn.classList.add('text-white');
                    btn.classList.remove('text-gray-400');
                } else {
                    btn.classList.remove('text-white');
                    btn.classList.add('text-gray-400');
                }
            });
            
            return true;
        } else {
            console.error(`❌ [navigationSystem] Página ${page} não encontrada`);
            return false;
        }
    },
    
    // Inicializa a navegação
    init: function() {
        console.log('🚀 [navigationSystem] Inicializando sistema de navegação...');
        
        // Garante que apenas dashboard esteja visível inicialmente
        this.navigateTo('dashboard');
        
        // Adiciona event listeners aos botões de navegação como fallback
        document.querySelectorAll('.nav-bottom-btn').forEach(btn => {
            const page = btn.getAttribute('data-page');
            if (page) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`🖱️ [navigationSystem] Botão ${page} clicado via event listener`);
                    this.navigateTo(page);
                });
            }
        });
        
        console.log('✅ [navigationSystem] Sistema de navegação inicializado');
    }
};

// ============================================
// REMOVER/DESABILITAR DIVS DE LOADING QUE PODEM BLOQUEAR CLIQUES
// ============================================
function removerDivsLoading() {
    console.log('🧹 [removerDivsLoading] Removendo/desabilitando divs de loading...');
    
    // Remove ou desabilita todas as divs com "loading" no ID
    const loadingDivs = document.querySelectorAll('[id*="loading"], [id*="Loading"], [class*="loading"], [class*="Loading"]');
    loadingDivs.forEach(div => {
        if (div.id === 'dashboardLoading' || div.classList.contains('loading')) {
            console.log(`🗑️ [removerDivsLoading] Removendo div de loading: ${div.id || 'sem-id'}`);
            div.style.display = 'none';
            div.style.pointerEvents = 'none';
            div.style.visibility = 'hidden';
            div.style.opacity = '0';
            div.style.zIndex = '-1';
            div.classList.add('hidden');
        }
    });
    
    // Especificamente para dashboardLoading (pode haver duplicatas)
    const dashboardLoading = document.querySelectorAll('#dashboardLoading');
    dashboardLoading.forEach(div => {
        console.log(`🗑️ [removerDivsLoading] Removendo #dashboardLoading`);
        div.style.display = 'none';
        div.style.pointerEvents = 'none';
        div.style.visibility = 'hidden';
        div.style.opacity = '0';
        div.style.zIndex = '-1';
        div.classList.add('hidden');
    });
    
    console.log('✅ [removerDivsLoading] Divs de loading removidas/desabilitadas');
}

// Executa imediatamente e também quando o DOM estiver pronto
removerDivsLoading();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            removerDivsLoading();
            window.navigationSystem?.init();
        }, 500);
    });
} else {
    setTimeout(() => {
        removerDivsLoading();
        window.navigationSystem?.init();
    }, 500);
}

// ============================================
// FUNÇÕES GLOBAIS PARA ONCLICK - GARANTIR ACESSIBILIDADE NO WEBVIEW ANDROID
// ============================================

// Funções de Modal de Medicamento
window.abrirModalMedicamento = function() {
    console.log('[abrirModalMedicamento] Abrindo modal de medicamento');
    const modal = document.getElementById('medicamentoModal');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        console.warn('[abrirModalMedicamento] Modal não encontrado');
    }
};

// Funções de Perfil/Biometria
window.registrarMedidaAvulsa = function() {
    console.log('[registrarMedidaAvulsa] Registrando medida avulsa');
    // TODO: Implementar lógica de registro de medida avulsa
};

window.registrarEvolucaoBiometria = function() {
    console.log('[registrarEvolucaoBiometria] Registrando evolução de biometria');
    // TODO: Implementar lógica de registro de evolução
};

// Funções de Configurações de Notificação
window.abrirConfigsNotificacao = function() {
    console.log('[abrirConfigsNotificacao] Abrindo configurações de notificação');
    const modal = document.getElementById('configsNotificacaoModal');
    if (modal) {
        modal.classList.remove('hidden');
    } else {
        console.warn('[abrirConfigsNotificacao] Modal não encontrado');
    }
};

window.salvarConfigsNotificacao = function() {
    console.log('[salvarConfigsNotificacao] Salvando configurações de notificação');
    // TODO: Implementar lógica de salvamento
    window.fecharConfigsNotificacao();
};

window.fecharConfigsNotificacao = function() {
    console.log('[fecharConfigsNotificacao] Fechando configurações de notificação');
    const modal = document.getElementById('configsNotificacaoModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Funções de Configurações de Água
window.saveWaterSettings = function() {
    console.log('[saveWaterSettings] Salvando configurações de água');
    // TODO: Implementar lógica de salvamento
    window.closeWaterSettings();
};

window.closeWaterSettings = function() {
    console.log('[closeWaterSettings] Fechando configurações de água');
    const modal = document.getElementById('waterModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Funções de Modal de Missão
window.closeAddMissionModal = function() {
    console.log('[closeAddMissionModal] Fechando modal de adicionar missão');
    const modal = document.getElementById('addMissionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// Funções de Agenda
window.closeAgendaModal = function() {
    console.log('[closeAgendaModal] Fechando modal de agenda');
    const modal = document.getElementById('agendaModal');
    if (modal) {
        modal.classList.add('hidden');
    }
};

// ============================================
// GARANTIR QUE TODAS AS FUNÇÕES CRÍTICAS ESTEJAM NO WINDOW
// ============================================

// Verificar e garantir que funções importantes estejam anexadas ao window
const funcoesCriticas = [
    'addWaterInstant',
    'openWaterSettings',
    'marcarRefeicao',
    'expandFocusTimer',
    'collapseFocusTimer',
    'startFocusTimer',
    'pauseFocusTimer',
    'finishFocusTimer',
    'iniciarAtividadeFisica',
    'pausarAtividadeFisica',
    'finalizarAtividadeFisica',
    'abrirTimerAtividadeFisica',
    'trocarAbaMissao',
    'alternarAtividade',
    'toggleFAB',
    'selecionarClasse',
    'criarPersonagem',
    'fazerLogout',
    'verificarPersonagemExistente',
    'verificarAutenticacao'
];

funcoesCriticas.forEach(nomeFuncao => {
    if (typeof window[nomeFuncao] !== 'function') {
        console.warn(`⚠️ [INICIALIZAÇÃO] Função ${nomeFuncao} não está anexada ao window!`);
    } else {
        console.log(`✅ [INICIALIZAÇÃO] Função ${nomeFuncao} está disponível globalmente`);
    }
});

// No final do ficheiro, avisa que está pronto
window.rpgScriptLoaded = true;
window.dispatchEvent(new Event('RPG_SCRIPT_READY'));

// Tenta vincular o botão via ID caso o onclick do HTML falhe
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-iniciar-jornada');
  if (btn) {
    btn.addEventListener('click', () => {
      console.log('ADS: Clique capturado via AddEventListener');
      window.criarPersonagem();
    });
  }
});
