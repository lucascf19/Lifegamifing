// ============================================
// DECLARAÇÃO DE VARIÁVEIS GLOBAIS (TOP PRIORITY)
// ============================================

// Variáveis de controle de carregamento - DECLARADAS PRIMEIRO
// Expõe no window para garantir acesso global ANTES de qualquer uso
if (typeof window !== 'undefined') {
  window.dashboardDataLoaded = window.dashboardDataLoaded || false;
  window.missionsDataLoaded = window.missionsDataLoaded || false;
}
// Declaração local também (para compatibilidade)
let dashboardDataLoaded = false;
let missionsDataLoaded = false;

// ============================================
// INICIALIZAÇÃO IMEDIATA DO SUPABASE E FUNÇÕES GLOBAIS
// ============================================

// Garante que o Supabase esteja disponível imediatamente
// Se não estiver disponível do main.jsx, tenta obter do window
if (typeof window !== 'undefined' && !window.supabaseClient) {
    console.warn('⚠️ Supabase não encontrado no window, tentando obter...');
    // Aguarda um pouco para o main.jsx inicializar
    setTimeout(() => {
        if (window.supabaseClient) {
            console.log('✅ Supabase obtido do window após delay');
        } else {
            console.error('❌ Supabase ainda não disponível após delay');
        }
    }, 100);
}

// ============================================
// EXPOSIÇÃO IMEDIATA DE FUNÇÕES CRÍTICAS
// ============================================

// Expõe funções críticas IMEDIATAMENTE para evitar erros de ReferenceError
// Essas funções serão redefinidas mais tarde, mas isso garante que existam desde o início

window.fecharNotificacaoCompromisso = function() {
    // Remove banner de escudo de rotina
    const bannerEscudo = document.getElementById('escudoRotinaIndicador');
    if (bannerEscudo) bannerEscudo.classList.add('hidden');
    
    // Remove banner de compromisso (se existir)
    const bannerCompromisso = document.getElementById('escudoCompromissoIndicador');
    if (bannerCompromisso) bannerCompromisso.classList.add('hidden');
    
    // Remove notificação de compromisso (se existir)
    const notificacao = document.getElementById('compromissoNotificacao');
    if (notificacao) notificacao.classList.add('hidden');
    
    // Remove aura amarela
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    body.classList.remove('escudo-compromisso', 'border-shield-compromisso', 'aura-amarela', 'aura-roxa');
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
        aura.classList.remove('aura-amarela', 'aura-roxa');
    }
    
    console.log('✅ Notificação de compromisso fechada e aura removida');
};

// Funções placeholder para evitar erros até serem definidas
window.marcarRefeicao = window.marcarRefeicao || function(tipo) {
    console.warn('⚠️ marcarRefeicao ainda não foi definida, tipo:', tipo);
};

window.addWaterInstant = window.addWaterInstant || function() {
    console.warn('⚠️ addWaterInstant ainda não foi definida');
};

window.openWaterSettings = window.openWaterSettings || function() {
    console.warn('⚠️ openWaterSettings ainda não foi definida');
};

window.expandFocusTimer = window.expandFocusTimer || function() {
    console.warn('⚠️ expandFocusTimer ainda não foi definida');
};

window.selecionarClasse = window.selecionarClasse || function(classe) {
    console.warn('⚠️ selecionarClasse ainda não foi definida, classe:', classe);
};

window.criarPersonagem = window.criarPersonagem || function() {
    console.warn('⚠️ criarPersonagem ainda não foi definida');
};

window.alternarTema = window.alternarTema || function(tema) {
    console.warn('⚠️ alternarTema ainda não foi definida, tema:', tema);
};

window.alternarTemaRPG = window.alternarTemaRPG || function() {
    console.warn('⚠️ alternarTemaRPG ainda não foi definida');
};

window.mostrarAbaDashboard = window.mostrarAbaDashboard || function(aba) {
    console.warn('⚠️ mostrarAbaDashboard ainda não foi definida, aba:', aba);
};

window.atualizarBarrasStatusRPG = window.atualizarBarrasStatusRPG || function() {
    // Placeholder silencioso
};

window.atualizarAtributosManutencao = window.atualizarAtributosManutencao || function() {
    // Placeholder silencioso
};

// Placeholder para aplicarTema (será redefinida mais tarde)
window.aplicarTema = window.aplicarTema || function(tema) {
    const body = document.body;
    const main = document.querySelector('main');
    
    if (tema === 'rpg') {
        body.classList.add('tema-rpg');
        if (main) main.classList.add('bg-[#000000]');
    } else {
        body.classList.remove('tema-rpg');
        if (main) main.classList.remove('bg-[#000000]');
    }
};

console.log('✅ Funções críticas expostas globalmente');

// ============================================
// HELPER: FUNÇÃO PARA OBTER DATA LOCAL
// ============================================
/**
 * Retorna a data no formato YYYY-MM-DD usando o horário LOCAL do sistema
 * em vez de UTC (que pode causar diferença de um dia dependendo do fuso horário)
 */
function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============================================
// SISTEMA DE EVENTOS EXTERNOS E ESCUDO DE ROTINA
// ============================================

// Lista de compromissos da agenda (simulado - em produção viria de uma API)
const eventosAgenda = [
    {
        id: 1,
        titulo: 'Almoço em Família',
        data: getLocalDateString(), // Hoje (usando horário local)
        hora: '12:00',
        duracao: 90, // minutos
        tipo: 'social'
    },
    {
        id: 2,
        titulo: 'Reunião de Trabalho',
        data: getLocalDateString(), // Hoje (usando horário local)
        hora: '14:30',
        duracao: 60,
        tipo: 'trabalho'
    },
    {
        id: 3,
        titulo: 'Academia',
        data: getLocalDateString(), // Hoje (usando horário local)
        hora: '18:00',
        duracao: 60,
        tipo: 'saude'
    }
];

// Estado do Escudo de Rotina
let escudoRotinaAtivo = false;
let eventoAtual = null;
let eventoConcluido = false;

// Estado dos Escudos
let modoEscudoAtivo = 'desativado'; // 'compromisso', 'recuperacao', 'desativado'
let escudoCompromissoTimer = null;
let escudoCompromissoTempoRestante = 0; // em segundos
let escudoCompromissoInterval = null;
let fabMenuAberto = false;

// Variáveis globais para widgets (declaradas antes de serem usadas)
let waterAlertCheckInterval = null;

/**
 * Verifica eventos externos e ativa Escudo de Rotina se necessário
 */
function verificarEventosExternos() {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes(); // minutos desde meia-noite
    const dataAtual = getLocalDateString(agora); // Usa horário local, não UTC
    
    // Procura eventos ativos no horário atual
    const eventoAtivo = eventosAgenda.find(evento => {
        if (evento.data !== dataAtual) return false;
        
        const [hora, minuto] = evento.hora.split(':').map(Number);
        const horaInicio = hora * 60 + minuto;
        const horaFim = horaInicio + evento.duracao;
        
        return horaAtual >= horaInicio && horaAtual < horaFim;
    });
    
    if (eventoAtivo && !escudoRotinaAtivo) {
        ativarEscudoRotina(eventoAtivo);
    } else if (!eventoAtivo && escudoRotinaAtivo) {
        desativarEscudoRotina();
    }
    
    // Atualiza indicador visual
    atualizarIndicadorEscudo();
}

/**
 * Ativa o Escudo de Rotina
 */
function ativarEscudoRotina(evento) {
    escudoRotinaAtivo = true;
    eventoAtual = evento;
    eventoConcluido = false;
    
    console.log('%c🛡️ Escudo de Rotina ATIVADO', 'color: #10b981; font-weight: bold;');
    console.log('📅 Evento:', evento.titulo);
    
    // Salva estado
    localStorage.setItem('escudoRotinaAtivo', 'true');
    localStorage.setItem('eventoAtual', JSON.stringify(evento));
    
    // Silencia alertas de água
    if (waterAlertCheckInterval) {
        clearInterval(waterAlertCheckInterval);
        waterAlertCheckInterval = null;
    }
    
    // Remove alerta visual se estiver ativo
    const waterWidget = document.getElementById('waterWidget');
    if (waterWidget) {
        waterWidget.classList.remove('alert');
    }
}

/**
 * Desativa o Escudo de Rotina
 */
function desativarEscudoRotina() {
    escudoRotinaAtivo = false;
    eventoAtual = null;
    
    console.log('%c🛡️ Escudo de Rotina DESATIVADO', 'color: #f59e0b; font-weight: bold;');
    
    // Remove estado
    localStorage.removeItem('escudoRotinaAtivo');
    localStorage.removeItem('eventoAtual');
    
    // Reativa verificação de alertas de água
    if (waterAlertInterval > 0) {
        startWaterAlertCheck();
    }
}

/**
 * Atualiza indicador visual do Escudo de Rotina
 */
function atualizarIndicadorEscudo() {
    const indicador = document.getElementById('escudoRotinaIndicador');
    if (!indicador) return;
    
    if (escudoRotinaAtivo && eventoAtual) {
        indicador.classList.remove('hidden');
        const titulo = indicador.querySelector('.escudo-titulo');
        if (titulo) {
            titulo.textContent = `🛡️ ${eventoAtual.titulo}`;
        }
    } else {
        indicador.classList.add('hidden');
    }
}

/**
 * Conclui evento da agenda e concede 50 XP
 */
async function concluirEventoAgenda() {
    if (!eventoAtual || eventoConcluido) {
        return;
    }
    
    eventoConcluido = true;
    
    // Adiciona 50 XP
    if (window.pointsSystem) {
        window.pointsSystem.addPoints(50);
    }
    
    // Salva no Supabase
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível salvar evento no Supabase');
                return;
            }
            
            await supabaseClient
                .from('atividades')
                .insert([{
                    user_id: userId,
                    nome_tarefa: `Evento: ${eventoAtual.titulo}`,
                    pontuacao: 50,
                    categoria: 'Social',
                    regiao: 'sa-east-1',
                    dados_extras: {
                        tipo: 'evento_agenda',
                        evento_id: eventoAtual.id
                    }
                }]);
            console.log('%c✅ Evento concluído e salvo no Supabase', 'color: #10b981; font-weight: bold;');
        } catch (error) {
            console.error('Erro ao salvar evento:', error);
        }
    }
    
    // Remove IMEDIATAMENTE a aura amarela e o banner
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    const bannerEscudo = document.getElementById('escudoRotinaIndicador');
    
    body.classList.remove('escudo-compromisso', 'border-shield-compromisso', 'aura-amarela', 'aura-roxa');
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
        aura.classList.remove('aura-amarela', 'aura-roxa');
    }
    if (bannerEscudo) {
        bannerEscudo.classList.add('hidden');
    }
    
    // Confetes de celebração
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.9 },
            colors: ['#10b981', '#34d399', '#6ee7b7']
        });
    }
    
    // Mostra modal de feedback de humor
    mostrarModalFeedbackEscudo();
    
    // Vibração
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
    
    // Atualiza botão
    const btn = document.getElementById('concluirEventoBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '✓ Evento Concluído';
        btn.classList.add('opacity-50');
    }
    
    // Desativa escudo após 5 segundos
    setTimeout(() => {
        desativarEscudoRotina();
        atualizarIndicadorEscudo();
    }, 5000);
}

// Verifica eventos a cada minuto
// Otimização: Verifica eventos externos a cada 60 segundos (limite para evitar crashes)
// Usa variável para poder limpar se necessário
let eventosExternosInterval = null;
if (typeof window !== 'undefined') {
  eventosExternosInterval = setInterval(() => {
    try {
      verificarEventosExternos();
    } catch (error) {
      console.error('❌ Erro ao verificar eventos externos:', error);
    }
  }, 60000); // 60 segundos
}

// Verifica imediatamente ao carregar
verificarEventosExternos();

// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================

// O cliente Supabase é criado no main.jsx e exposto em window.supabaseClient
// Este script usa o cliente já criado
// Função helper para obter o cliente Supabase
function getSupabaseClient() {
    return window.supabaseClient || null;
}

// Variável global para armazenar o objeto completo do usuário após login
// Isso garante que o RLS do Supabase funcione corretamente
window.currentUser = null;

/**
 * Atualiza a variável global currentUser com o objeto completo do usuário autenticado
 * Deve ser chamada após login bem-sucedido
 */
async function updateCurrentUser() {
    const client = getSupabaseClient();
    if (!client) {
        window.currentUser = null;
        return null;
    }
    
    try {
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error || !session || !session.user) {
            window.currentUser = null;
            return null;
        }
        
        window.currentUser = session.user;
        console.log('✅ currentUser atualizado:', window.currentUser.id, window.currentUser.email);
        return window.currentUser;
    } catch (error) {
        console.error('Erro ao atualizar currentUser:', error);
        window.currentUser = null;
        return null;
    }
}

/**
 * Obtém o ID do usuário autenticado de forma consistente
 * Versão síncrona que retorna da variável global (mais rápida)
 * @returns {string|null} Retorna o user_id ou null se não estiver autenticado
 */
function getCurrentUserId() {
    // Retorna o ID da variável global se disponível
    if (window.currentUser && window.currentUser.id) {
        return window.currentUser.id;
    }
    
    return null;
}

/**
 * Versão async do getCurrentUserId para casos que precisam aguardar
 * @returns {Promise<string|null>} Retorna o user_id ou null se não estiver autenticado
 */
async function getCurrentUserIdAsync() {
    // Primeiro tenta a variável global
    if (window.currentUser && window.currentUser.id) {
        return window.currentUser.id;
    }
    
    // Se não houver, atualiza e retorna
    const user = await updateCurrentUser();
    return user ? user.id : null;
}

// Cria um objeto proxy que sempre retorna window.supabaseClient quando acessado
// Isso permite que todo o código existente continue funcionando sem mudanças
let supabaseClient = null;

// Atualiza a referência quando o cliente estiver disponível
let checkSupabaseInterval = null;
if (typeof window !== 'undefined') {
  checkSupabaseInterval = setInterval(() => {
    try {
      if (window.supabaseClient) {
        supabaseClient = window.supabaseClient;
        console.log('%c✅ Supabase conectado (usando cliente do main.jsx)', 'color: #10b981; font-weight: bold;');
        if (checkSupabaseInterval) {
          clearInterval(checkSupabaseInterval);
          checkSupabaseInterval = null;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar Supabase:', error);
    }
  }, 50);
  
  // Limpa o intervalo após 5 segundos (timeout de segurança)
  setTimeout(() => {
    if (checkSupabaseInterval) {
      clearInterval(checkSupabaseInterval);
      checkSupabaseInterval = null;
    }
    if (!supabaseClient) {
      console.warn('%c⚠️ Supabase não encontrado após 5 segundos', 'color: #f59e0b; font-weight: bold;');
    }
  }, 5000);
}

// ============================================
// SISTEMA DE AUTENTICAÇÃO E PERFIL
// ============================================

let classeSelecionada = null;
let magicLinkCooldown = false; // Previne múltiplos envios
let magicLinkCooldownTimer = null;

/**
 * Login com OAuth (Google, GitHub, etc)
 * Usa Deep Linking para retornar ao app após autenticação
 */
async function loginWithOAuth(provider = 'google') {
    const client = getSupabaseClient();
    if (!client) {
        console.error('Supabase não configurado');
        alert('Erro: Supabase não configurado');
        return;
    }
    
    try {
        // Detecta se está rodando no Capacitor (app nativo)
        const isCapacitor = window.Capacitor !== undefined;
        
        // Define redirectTo EXATAMENTE como capacitor://localhost para app nativo
        const redirectTo = isCapacitor 
            ? 'capacitor://localhost' // Deep Link EXATO para app nativo
            : `${window.location.origin}${window.location.pathname}`; // URL web
        
        console.log('🔐 Iniciando login OAuth com', provider);
        console.log('📍 RedirectTo (exato):', redirectTo);
        
        const { data, error } = await client.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: redirectTo,
                skipBrowserRedirect: true // Não redireciona automaticamente, vamos usar Browser.open
            }
        });
        
        if (error) {
            console.error('❌ Erro no OAuth:', error);
            alert(`Erro ao fazer login: ${error.message}`);
            return;
        }
        
        // Se retornou URL, abre no Browser do Capacitor
        if (data.url) {
            console.log('✅ URL de autenticação gerada:', data.url);
            
            if (isCapacitor) {
                // Usa @capacitor/browser para abrir o link de login
                try {
                    const { Browser } = await import('@capacitor/browser');
                    await Browser.open({ 
                        url: data.url,
                        windowName: '_self'
                    });
                    console.log('🌐 Browser aberto para autenticação OAuth');
                } catch (browserError) {
                    console.error('❌ Erro ao abrir Browser:', browserError);
                    // Fallback: abre em nova aba do navegador
                    window.open(data.url, '_blank');
                }
            } else {
                // Web: redireciona normalmente
                window.location.href = data.url;
            }
        }
    } catch (error) {
        console.error('❌ Erro ao fazer login OAuth:', error);
        alert(`Erro ao fazer login: ${error.message}`);
    }
}

/**
 * Envia Magic Link por e-mail
 */
async function enviarMagicLink() {
    console.log('🚀 Função enviarMagicLink chamada');
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginMessage = document.getElementById('loginMessage');
    const loginSuccess = document.getElementById('loginSuccess');
    
    // Obtém o cliente Supabase
    const client = getSupabaseClient();
    
    if (!emailInput || !passwordInput || !client) {
        console.error('❌ Elementos não encontrados ou Supabase não configurado');
        console.error('Email input:', emailInput);
        console.error('Password input:', passwordInput);
        console.error('Supabase client:', client);
        if (!client) {
            console.error('Aguarde o Supabase ser inicializado...');
            if (loginMessage) {
                loginMessage.textContent = 'Aguarde o Supabase ser inicializado...';
                loginMessage.className = 'text-center text-sm text-yellow-400';
                loginMessage.classList.remove('hidden');
            }
        }
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('📧 Tentando login com:', email);
    console.log('🔑 Senha fornecida:', password ? '***' : 'vazia');
    
    if (!email || !email.includes('@')) {
        console.warn('⚠️ E-mail inválido:', email);
        if (loginMessage) {
            loginMessage.textContent = 'Por favor, insira um e-mail válido';
            loginMessage.className = 'text-center text-sm text-red-400';
            loginMessage.classList.remove('hidden');
        }
        return;
    }
    
    if (!password || password.length < 3) {
        console.warn('⚠️ Senha inválida (mínimo 3 caracteres)');
        if (loginMessage) {
            loginMessage.textContent = 'Por favor, insira uma senha válida';
            loginMessage.className = 'text-center text-sm text-red-400';
            loginMessage.classList.remove('hidden');
        }
        return;
    }
    
    // Desabilita botão
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Entrando...';
    }
    if (loginMessage) {
        loginMessage.classList.add('hidden');
    }
    if (loginSuccess) {
        loginSuccess.classList.remove('hidden');
    }
    
    try {
        console.log('🔄 Tentando fazer login com Supabase...');
        // Tenta fazer login com email e senha
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        console.log('📥 Resposta do servidor:', { 
            hasData: !!data, 
            hasError: !!error,
            errorCode: error?.status || error?.code,
            errorMessage: error?.message 
        });
        
        if (error) {
            console.error('❌ Erro no login:', error);
            console.error('Código do erro:', error.status || error.code);
            console.error('Mensagem do erro:', error.message);
            
            // Se o usuário não existir, tenta criar
            if (error.message?.includes('Invalid login credentials') || error.message?.includes('User not found')) {
                console.log('👤 Usuário não encontrado, tentando criar...');
                
                // Cria o usuário
                const { data: signUpData, error: signUpError } = await client.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        emailRedirectTo: window.location.origin + window.location.pathname
                    }
                });
                
                console.log('📥 Resposta do signUp:', { 
                    hasData: !!signUpData, 
                    hasError: !!signUpError,
                    hasUser: !!signUpData?.user 
                });
                
                if (signUpError) {
                    console.error('❌ Erro ao criar usuário:', signUpError);
                    throw signUpError;
                }
                
                // Se criou com sucesso, faz login
                if (signUpData.user) {
                    console.log('✅ Usuário criado, tentando fazer login...');
                    const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    console.log('📥 Resposta do login após signUp:', { 
                        hasData: !!loginData, 
                        hasError: !!loginError 
                    });
                    
                    if (loginError) {
                        console.error('❌ Erro ao fazer login após criar usuário:', loginError);
                        throw loginError;
                    }
                    
                    console.log('%c✅ Usuário criado e logado com sucesso!', 'color: #10b981; font-weight: bold;');
                }
            } else {
                // Outros erros (401, 500, etc)
                console.error('❌ Erro de autenticação:', error.status || error.code, error.message);
                throw error;
            }
        } else {
            console.log('%c✅ Login realizado com sucesso!', 'color: #10b981; font-weight: bold;');
            console.log('📊 Dados da sessão:', { 
                hasUser: !!data?.user, 
                hasSession: !!data?.session 
            });
        }
        
        // Aguarda um pouco para a sessão ser criada
        console.log('⏳ Aguardando criação da sessão...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verifica autenticação automaticamente
        console.log('🔍 Verificando autenticação...');
        await verificarAutenticacao();
        
    } catch (error) {
        console.error('❌ Erro ao fazer login (catch):', error);
        console.error('Tipo do erro:', typeof error);
        console.error('Código do erro:', error.status || error.code || 'N/A');
        console.error('Mensagem do erro:', error.message || 'Erro desconhecido');
        
        // Feedback visual de erro
        if (loginSuccess) {
            loginSuccess.classList.add('hidden');
        }
        
        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        if (error.status === 401 || error.code === 'invalid_credentials') {
            errorMessage = 'E-mail ou senha incorretos.';
        } else if (error.status === 500 || error.code === 'internal_error') {
            errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        // Mostra alerta se possível
        try {
            alert(`Erro ao fazer login: ${errorMessage}`);
        } catch (alertError) {
            console.warn('Não foi possível mostrar alert:', alertError);
        }
        
        if (loginMessage) {
            loginMessage.textContent = errorMessage;
            loginMessage.className = 'text-center text-sm text-red-400';
            loginMessage.classList.remove('hidden');
        }
        
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Entrar';
        }
    }
}

/**
 * Inicia cooldown para envio de Magic Link
 */
function iniciarCooldownMagicLink(segundos) {
    // Limpa timer anterior se existir
    if (magicLinkCooldownTimer) {
        clearInterval(magicLinkCooldownTimer);
    }
    
    const loginBtn = document.getElementById('loginBtn');
    let tempoRestante = segundos;
    
    // Atualiza botão com contador
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = `Aguarde ${tempoRestante}s...`;
    }
    
    magicLinkCooldownTimer = setInterval(() => {
        tempoRestante--;
        
        if (loginBtn) {
            if (tempoRestante > 0) {
                loginBtn.textContent = `Aguarde ${tempoRestante}s...`;
            } else {
                loginBtn.textContent = 'Enviar Link Mágico';
                loginBtn.disabled = false;
            }
        }
        
        if (tempoRestante <= 0) {
            magicLinkCooldown = false;
            clearInterval(magicLinkCooldownTimer);
            magicLinkCooldownTimer = null;
        }
    }, 1000);
}

/**
 * Seleciona classe do personagem
 */
function selecionarClasse(classe) {
    classeSelecionada = classe;
    
    // Remove seleção anterior
    document.querySelectorAll('.classe-option').forEach(btn => {
        const classeData = btn.getAttribute('data-classe');
        if (classeData === 'O Hiperfocado') {
            btn.classList.remove('border-blue-500', 'ring-2', 'ring-blue-500/50');
            btn.classList.add('border-blue-500/30');
        } else if (classeData === 'Explorador do Caos') {
            btn.classList.remove('border-green-500', 'ring-2', 'ring-green-500/50');
            btn.classList.add('border-green-500/30');
        } else if (classeData === 'Sentinela da Ordem') {
            btn.classList.remove('border-yellow-500', 'ring-2', 'ring-yellow-500/50');
            btn.classList.add('border-yellow-500/30');
        } else if (classeData === 'O Arquiteto de Fluxos') {
            btn.classList.remove('border-purple-500', 'ring-2', 'ring-purple-500/50');
            btn.classList.add('border-purple-500/30');
        }
    });
    
    // Adiciona seleção atual
    const btnSelecionado = document.querySelector(`[data-classe="${classe}"]`);
    if (btnSelecionado) {
        if (classe === 'O Hiperfocado') {
            btnSelecionado.classList.remove('border-blue-500/30');
            btnSelecionado.classList.add('border-blue-500', 'ring-2', 'ring-blue-500/50');
        } else if (classe === 'Explorador do Caos') {
            btnSelecionado.classList.remove('border-green-500/30');
            btnSelecionado.classList.add('border-green-500', 'ring-2', 'ring-green-500/50');
        } else if (classe === 'Sentinela da Ordem') {
            btnSelecionado.classList.remove('border-yellow-500/30');
            btnSelecionado.classList.add('border-yellow-500', 'ring-2', 'ring-yellow-500/50');
        } else if (classe === 'O Arquiteto de Fluxos') {
            btnSelecionado.classList.remove('border-purple-500/30');
            btnSelecionado.classList.add('border-purple-500', 'ring-2', 'ring-purple-500/50');
        }
    }
    
    // Habilita botão de criar
    const createBtn = document.getElementById('createCharacterBtn');
    const nameInput = document.getElementById('characterName');
    if (createBtn && nameInput && nameInput.value.trim()) {
        createBtn.disabled = false;
    }
}

/**
 * Cria personagem no Supabase
 */
async function criarPersonagem() {
    alert('Enviando dados ao Supabase...');
    console.log('Tentando salvar...');
    console.log('🎮 [criarPersonagem] Função chamada');
    
    const nameInput = document.getElementById('characterName');
    const createBtn = document.getElementById('createCharacterBtn');
    const messageEl = document.getElementById('characterCreationMessage');
    
    // Obtém o cliente Supabase
    const client = getSupabaseClient();
    
    if (!nameInput || !createBtn || !client) {
        if (!client) {
            console.error('❌ [criarPersonagem] Supabase não configurado');
            if (messageEl) {
                messageEl.textContent = 'Aguarde o Supabase ser inicializado...';
                messageEl.className = 'text-center text-sm text-yellow-400';
                messageEl.classList.remove('hidden');
            }
        }
        return;
    }
    
    const nome = nameInput.value.trim();
    
    if (!nome || nome.length < 2) {
        if (messageEl) {
            messageEl.textContent = 'O nome deve ter pelo menos 2 caracteres';
            messageEl.className = 'text-center text-sm text-red-400';
            messageEl.classList.remove('hidden');
        }
        return;
    }
    
    if (!classeSelecionada) {
        if (messageEl) {
            messageEl.textContent = 'Selecione uma classe';
            messageEl.className = 'text-center text-sm text-red-400';
            messageEl.classList.remove('hidden');
        }
        return;
    }
    
    // Desabilita botão
    createBtn.disabled = true;
    createBtn.textContent = 'Criando...';
    if (messageEl) messageEl.classList.add('hidden');
    
    try {
        // Verifica sessão atual primeiro
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) {
            console.error('❌ [criarPersonagem] Erro ao obter sessão:', sessionError);
            throw new Error('Erro ao verificar autenticação. Tente fazer login novamente.');
        }
        
        if (!session) {
            console.error('❌ [criarPersonagem] Nenhuma sessão encontrada');
            throw new Error('Usuário não autenticado. Faça login novamente.');
        }
        
        const user = session.user;
        
        if (!user || !user.id) {
            console.error('❌ [criarPersonagem] Usuário não encontrado na sessão:', session);
            throw new Error('Usuário não encontrado na sessão.');
        }
        
        // Atualiza variável global com o objeto completo do usuário
        window.currentUser = user;
        
        console.log('✅ [criarPersonagem] Usuário autenticado:', user.id, user.email);
        console.log('📋 [criarPersonagem] Dados do personagem:', { nome, classe: classeSelecionada });
        
        // INICIANDO_SALVAMENTO
        console.log('INICIANDO_SALVAMENTO');
        console.log('📤 [criarPersonagem] Enviando dados para Supabase...');
        console.log('📤 [criarPersonagem] Payload:', {
            id: user.id,
            nome_usuario: nome,
            classe: classeSelecionada,
            nivel: 1
        });
        
        // Cria perfil com ID do usuário logado
        const { data: profileData, error } = await client
            .from('profiles')
            .insert([{
                id: user.id,
                nome_usuario: nome,
                classe: classeSelecionada,
                nivel: 1,
                xp: 0,
                energia_total: 0,
                foco_total: 0,
                modo_escudo: 'desativado',
                config_alerta_agua: 120,
                updated_at: new Date().toISOString()
            }])
            .select();
        
        console.log('📥 [criarPersonagem] Resposta do Supabase:', { 
            hasData: !!profileData, 
            hasError: !!error,
            errorCode: error?.code,
            errorMessage: error?.message
        });
        
        if (error) {
            console.error('Erro ao criar perfil:', error);
            // Mensagens mais específicas para erros comuns
            if (error.code === '23505') {
                throw new Error('Este perfil já existe. Tente fazer login novamente.');
            } else if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('403')) {
                throw new Error('Sem permissão para criar perfil. Verifique as políticas RLS no Supabase.');
            } else if (error.message?.includes('406') || error.code === 'PGRST116') {
                throw new Error('Formato de requisição inválido. Verifique a estrutura da tabela profiles.');
            } else if (error.message) {
                throw new Error(`Erro ao criar perfil: ${error.message}`);
            }
            throw error;
        }
        
        if (profileData && profileData.length > 0) {
            console.log('%c✨ Personagem criado com sucesso!', 'color: #10b981; font-weight: bold;');
            console.log('%c👤 ID do usuário:', 'color: #6366f1; font-weight: bold;', user.id);
            console.log('%c🎮 Classe:', 'color: #6366f1; font-weight: bold;', classeSelecionada);
            console.log('%c📊 Perfil criado:', 'color: #10b981; font-weight: bold;', profileData[0]);
        } else {
            throw new Error('Perfil não foi criado corretamente');
        }
        
        // Carrega perfil do usuário para aplicar bônus de classe
        await carregarPerfilUsuario();
        
        // Animação de fade-out na tela de criação
        const creationScreen = document.getElementById('characterCreationScreen');
        if (creationScreen) {
            creationScreen.style.transition = 'opacity 0.5s ease-out';
            creationScreen.style.opacity = '0';
            
            setTimeout(() => {
                creationScreen.classList.add('hidden');
                
                // Mostra app com fade-in
                const appContainer = document.getElementById('app-container');
                if (appContainer) {
                    appContainer.classList.remove('hidden');
                    appContainer.style.opacity = '0';
                    appContainer.style.transition = 'opacity 0.5s ease-in';
                    
                    // Força reflow
                    void appContainer.offsetWidth;
                    
                    setTimeout(() => {
                        appContainer.style.opacity = '1';
                    }, 50);
                }
                
                // Inicializa app
                inicializarApp();
                
                // Navega para página de Missões após animação
                setTimeout(() => {
                    if (navigationSystem) {
                        navigationSystem.navigateTo('missions');
                    }
                }, 600);
            }, 500);
        } else {
            // Fallback se não houver animação
            const appContainer = document.getElementById('app-container');
            if (appContainer) appContainer.classList.remove('hidden');
            inicializarApp();
        }
    } catch (error) {
        console.error('Erro ao criar personagem:', error);
        messageEl.textContent = error.message || 'Erro ao criar personagem. Tente novamente.';
        messageEl.className = 'text-center text-sm text-red-400';
        messageEl.classList.remove('hidden');
        createBtn.disabled = false;
        createBtn.textContent = 'Iniciar Jornada';
    }
}

/**
 * Verifica autenticação e perfil
 */
async function verificarAutenticacao() {
    const client = getSupabaseClient();
    if (!client) {
        console.warn('Supabase não configurado - mostrando app sem autenticação');
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('app-container');
        if (loginScreen) loginScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        inicializarApp();
        return;
    }
    
    try {
        // Verifica sessão atual
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) {
            throw sessionError;
        }
        
        // Se não houver sessão, mostra tela de login
        if (!session) {
            window.currentUser = null;
            const loginScreen = document.getElementById('loginScreen');
            const appContainer = document.getElementById('app-container');
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (appContainer) appContainer.classList.add('hidden');
            return;
        }
        
        // Atualiza variável global com o objeto completo do usuário
        if (session.user) {
            window.currentUser = session.user;
            console.log('✅ currentUser atualizado:', window.currentUser.id, window.currentUser.email);
        }
        
        // Verifica se existe perfil
        // Usa maybeSingle() para evitar erro quando não há perfil
        let profile = null;
        let profileError = null;
        
        try {
            const result = await client
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
            
            profile = result.data;
            profileError = result.error;
        } catch (err) {
            // Se der erro 406, pode ser problema de formato - tenta com colunas específicas
            if (err.message?.includes('406') || err.code === 'PGRST301') {
                console.warn('Erro 406 ao buscar perfil, tentando com colunas específicas...');
                try {
                    const retryResult = await client
                        .from('profiles')
                        .select('id, nome_usuario, classe, nivel, xp, energia_total, foco_total, modo_escudo, config_alerta_agua, updated_at')
                        .eq('id', session.user.id)
                        .maybeSingle();
                    
                    profile = retryResult.data;
                    profileError = retryResult.error;
                } catch (retryErr) {
                    console.error('Erro ao buscar perfil (retry):', retryErr);
                    profileError = retryErr;
                }
            } else {
                profileError = err;
            }
        }
        
        // Se houver erro e não for "nenhuma linha encontrada", lança o erro
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('Erro ao buscar perfil:', profileError);
            // Não lança o erro, apenas continua sem perfil (vai mostrar tela de criação)
        }
        
        // Se não tiver perfil, mostra tela de criação
        if (!profile) {
            console.log('--- RENDERIZANDO TELA DE CRIAÇÃO ---');
            console.log('📋 [script.js] Perfil não encontrado, mostrando tela de criação');
            
            const loginScreen = document.getElementById('loginScreen');
            const creationScreen = document.getElementById('characterCreationScreen');
            const appContainer = document.getElementById('app-container');
            
            console.log('🔍 [script.js] Elementos encontrados:', {
                loginScreen: !!loginScreen,
                creationScreen: !!creationScreen,
                appContainer: !!appContainer
            });
            
            // Remove bloqueios de loading
            if (typeof window !== 'undefined') {
                window.dashboardDataLoaded = true;
                window.missionsDataLoaded = true;
                console.log('✅ [script.js] Variáveis globais desbloqueadas');
            }
            
            if (loginScreen) {
                loginScreen.classList.add('hidden');
                console.log('✅ [script.js] Login screen escondido');
            } else {
                console.error('❌ [script.js] loginScreen não encontrado!');
            }
            
            if (creationScreen) {
                // FORÇA ESTILOS DE EMERGÊNCIA
                creationScreen.style.backgroundColor = '#121212';
                creationScreen.style.height = '100vh';
                creationScreen.style.width = '100vw';
                creationScreen.style.position = 'fixed';
                creationScreen.style.top = '0';
                creationScreen.style.left = '0';
                creationScreen.style.zIndex = '9999';
                creationScreen.style.display = 'flex';
                creationScreen.style.flexDirection = 'column';
                creationScreen.style.justifyContent = 'flex-start';
                creationScreen.style.paddingTop = '150px';
                creationScreen.style.alignItems = 'center';
                // DESATIVA ANIMAÇÕES
                creationScreen.style.animation = 'none';
                creationScreen.style.transition = 'none';
                
                creationScreen.classList.remove('hidden');
                console.log('✅ Tela de criação exibida (CSS de emergência aplicado)');
                
                // Carrega dados de criação (classes, avatares, etc)
                carregarDadosCriacao();
                
                // FORÇA ESTILOS NO INPUT
                const nameInput = document.getElementById('characterName');
                if (nameInput) {
                    nameInput.style.border = '2px solid white';
                    nameInput.style.padding = '15px';
                    nameInput.style.color = 'white';
                    nameInput.style.background = 'black';
                    nameInput.style.width = '80%';
                    nameInput.style.fontSize = '18px';
                    nameInput.style.animation = 'none';
                    nameInput.style.transition = 'none';
                    
                    // Auto-focus após um delay mínimo
                    setTimeout(() => {
                        console.log('✅ Campo de nome encontrado, aplicando foco...');
                        nameInput.focus();
                    }, 100);
                } else {
                    console.error('❌ Campo de nome não encontrado!');
                }
            } else {
                console.error('❌ Elemento characterCreationScreen não encontrado!');
            }
            if (appContainer) appContainer.classList.add('hidden');
            return;
        }
        
        // Tudo OK - mostra app e navega para missões
        const loginScreen = document.getElementById('loginScreen');
        const creationScreen = document.getElementById('characterCreationScreen');
        const appContainer = document.getElementById('app-container');
        
        if (loginScreen) loginScreen.classList.add('hidden');
        if (creationScreen) creationScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        
        // Carrega perfil do usuário
        await carregarPerfilUsuario();
        
        // Inicializa app
        inicializarApp();
        
        // Navega para página de Missões quando tiver personagem
        setTimeout(() => {
            if (window.navigationSystem) {
                window.navigationSystem.navigateTo('missions');
            }
        }, 100);
        
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Em caso de erro, mostra tela de login
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('app-container');
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
    }
    
    // Expõe globalmente para o main.jsx usar
    window.verificarAutenticacao = verificarAutenticacao;
}

/**
 * Carrega dados necessários para a tela de criação (classes, avatares, etc)
 */
async function carregarDadosCriacao() {
    console.log('📦 [carregarDadosCriacao] Iniciando carregamento de dados...');
    
    try {
        const client = getSupabaseClient();
        
        // Fallback: Classes padrão caso Supabase não esteja disponível ou tabela vazia
        const classesPadrao = [
            { id: 1, nome: 'O Hiperfocado', descricao: '+20% XP em Foco' },
            { id: 2, nome: 'Explorador do Caos', descricao: 'Bônus aleatórios em Rotina' },
            { id: 3, nome: 'Sentinela da Ordem', descricao: '2x Cristais com streak' },
            { id: 4, nome: 'O Arquiteto de Fluxos', descricao: 'Equilibra Ordem e Hiperfoco' }
        ];
        
        let dados = {
            classes: classesPadrao,
            carregado: true,
            timestamp: new Date().toISOString(),
            fonte: 'fallback'
        };
        
        // Tenta buscar do Supabase se disponível
        let dbClasses = [];
        if (client) {
            try {
                // Tenta buscar classes de uma tabela 'classes' se existir
                const { data: classesData, error: classesError } = await client
                    .from('classes')
                    .select('*')
                    .order('id');
                
                if (!classesError && classesData && classesData.length > 0) {
                    dbClasses = classesData;
                    console.log('✅ [carregarDadosCriacao] Classes encontradas no Supabase:', dbClasses.length);
                } else {
                    console.log('ℹ️ [carregarDadosCriacao] Nenhuma classe no Supabase, usando fallback');
                }
            } catch (dbError) {
                console.warn('⚠️ [carregarDadosCriacao] Erro ao buscar do Supabase, usando fallback:', dbError);
                dados.fonte = 'fallback_erro';
            }
        } else {
            console.warn('⚠️ [carregarDadosCriacao] Supabase não disponível, usando fallback');
            dados.fonte = 'fallback_supabase_indisponivel';
        }
        
        // Usa classes do banco se existirem, senão usa fallback
        const classes = dbClasses.length > 0 ? dbClasses : classesPadrao;
        dados.classes = classes;
        dados.fonte = dbClasses.length > 0 ? 'supabase' : dados.fonte;
        
        console.log('DADOS_CRIACAO_CARREGADOS', dados);
        console.log('✅ [carregarDadosCriacao] Dados carregados com sucesso');
        
        // Garante que os botões de classe estejam visíveis
        const classeButtons = document.querySelectorAll('.classe-option');
        const classeContainer = document.querySelector('.space-y-3');
        if (classeButtons.length > 0) {
            classeButtons.forEach(btn => {
                btn.style.display = 'block';
                btn.style.visibility = 'visible';
                btn.style.opacity = '1';
            });
            console.log('✅ [carregarDadosCriacao] Botões de classe tornados visíveis:', classeButtons.length);
        }
        if (classeContainer) {
            classeContainer.style.display = 'block';
            classeContainer.style.visibility = 'visible';
        }
        
        // Configura o input de nome após carregar dados
        configurarInputNome();
        
    } catch (error) {
        console.error('❌ [carregarDadosCriacao] Erro ao carregar dados:', error);
        // Mesmo em caso de erro, usa fallback
        const dadosFallback = {
            classes: [
                { id: 1, nome: 'O Hiperfocado', descricao: '+20% XP em Foco' },
                { id: 2, nome: 'Explorador do Caos', descricao: 'Bônus aleatórios em Rotina' },
                { id: 3, nome: 'Sentinela da Ordem', descricao: '2x Cristais com streak' },
                { id: 4, nome: 'O Arquiteto de Fluxos', descricao: 'Equilibra Ordem e Hiperfoco' }
            ],
            carregado: true,
            fonte: 'fallback_erro',
            timestamp: new Date().toISOString()
        };
        console.log('DADOS_CRIACAO_CARREGADOS', dadosFallback);
        configurarInputNome();
    }
}

/**
 * Listener para mudanças de autenticação
 */
function configurarAuthListener() {
    if (!supabaseClient) return;
    
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Atualiza a variável global currentUser com o objeto completo
            if (session && session.user) {
                window.currentUser = session.user;
                console.log('✅ currentUser atualizado via onAuthStateChange:', window.currentUser.id);
            }
            await verificarAutenticacao();
        } else if (event === 'SIGNED_OUT') {
            window.currentUser = null;
            const loginScreen = document.getElementById('loginScreen');
            const appContainer = document.getElementById('app-container');
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (appContainer) appContainer.classList.add('hidden');
        }
    });
}

/**
 * Carrega perfil do usuário do Supabase
 */
async function carregarPerfilUsuario() {
    const client = getSupabaseClient();
    if (!client) {
        window.userProfile = null;
        return;
    }
    
    try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) {
            window.userProfile = null;
            return;
        }
        
        const { data: profile, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.warn('Erro ao carregar perfil:', error);
            window.userProfile = null;
            return;
        }
        
        window.userProfile = profile;
        console.log('%c👤 Perfil carregado:', 'color: #10b981; font-weight: bold;', profile);
        
        // Atualiza as páginas se estiverem visíveis
        atualizarPaginaPerfil();
        atualizarPaginaStats();
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        window.userProfile = null;
    }
}

/**
 * Habilita botão de criar quando nome é preenchido
 */
function configurarInputNome() {
    const nameInput = document.getElementById('characterName');
    const createBtn = document.getElementById('createCharacterBtn');
    
    if (nameInput && createBtn) {
        // Auto-focus no campo de nome quando a tela aparecer
        setTimeout(() => {
            if (nameInput && !nameInput.value) {
                nameInput.focus();
            }
        }, 500);
        
        nameInput.addEventListener('input', () => {
            const nome = nameInput.value.trim();
            if (nome.length >= 2 && classeSelecionada) {
                createBtn.disabled = false;
            } else {
                createBtn.disabled = true;
            }
        });
        
        // Permite Enter para criar
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !createBtn.disabled) {
                criarPersonagem();
            }
        });
        
        // Quando o campo recebe foco (teclado abre), garante que fique visível
        nameInput.addEventListener('focus', () => {
            // Aguarda um pouco para o teclado abrir
            setTimeout(() => {
                nameInput.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 300);
        });
    }
}

// Torna funções acessíveis globalmente
/**
 * Sincroniza realidade - cria personagem e navega para dashboard
 */
async function sincronizarRealidade() {
    const nameInput = document.getElementById('characterName');
    const finalizarBtn = document.getElementById('btn-finalizar-personagem');
    const messageEl = document.getElementById('characterCreationMessage');
    
    // Obtém o cliente Supabase
    const client = getSupabaseClient();
    
    if (!nameInput || !finalizarBtn || !client) {
        if (!client) {
            console.error('Supabase não configurado');
            if (messageEl) {
                messageEl.textContent = 'Aguarde o Supabase ser inicializado...';
                messageEl.className = 'text-center text-sm text-yellow-400';
                messageEl.classList.remove('hidden');
            }
        }
        return;
    }
    
    const nome = nameInput.value.trim();
    
    // Obtém altura e peso do formulário
    const heightInput = document.getElementById('characterHeight');
    const weightInput = document.getElementById('characterWeight');
    const altura = heightInput ? parseFloat(heightInput.value) : null;
    const peso = weightInput ? parseFloat(weightInput.value) : null;
    
    if (!nome || nome.length < 2) {
        if (messageEl) {
            messageEl.textContent = 'O nome deve ter pelo menos 2 caracteres';
            messageEl.className = 'text-center text-sm text-red-400';
            messageEl.classList.remove('hidden');
        }
        return;
    }
    
    if (!classeSelecionada) {
        if (messageEl) {
            messageEl.textContent = 'Selecione uma classe';
            messageEl.className = 'text-center text-sm text-red-400';
            messageEl.classList.remove('hidden');
        }
        return;
    }
    
    // Valida altura e peso
    if (!altura || altura < 100 || altura > 250) {
        if (messageEl) {
            messageEl.textContent = 'Altura deve estar entre 100 e 250 cm';
            messageEl.className = 'text-center text-sm text-red-400';
            messageEl.classList.remove('hidden');
        }
        return;
    }
    
    if (!peso || peso < 30 || peso > 300) {
        if (messageEl) {
            messageEl.textContent = 'Peso deve estar entre 30 e 300 kg';
            messageEl.className = 'text-center text-sm text-red-400';
            messageEl.classList.remove('hidden');
        }
        return;
    }
    
    // Desabilita botão
    finalizarBtn.disabled = true;
    finalizarBtn.textContent = 'Sincronizando...';
    if (messageEl) messageEl.classList.add('hidden');
    
    try {
        // Verifica se há sessão ativa primeiro
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError) {
            console.error('Erro ao obter sessão:', sessionError);
            throw new Error('Erro ao verificar autenticação. Tente fazer login novamente.');
        }
        
        if (!session) {
            console.error('Nenhuma sessão encontrada');
            throw new Error('Usuário não autenticado. Faça login novamente.');
        }
        
        const user = session.user;
        
        if (!user || !user.id) {
            console.error('Usuário não encontrado na sessão:', session);
            throw new Error('Usuário não encontrado na sessão.');
        }
        
        // Atualiza variável global com o objeto completo do usuário
        window.currentUser = user;
        
        console.log('✅ Usuário autenticado:', user.id, user.email);
        
        // Cria perfil com ID do usuário logado
        const { data: profileData, error } = await client
            .from('profiles')
            .insert([{
                id: user.id,
                nome_usuario: nome,
                classe: classeSelecionada,
                nivel: 1,
                xp: 0,
                energia_total: 0,
                foco_total: 0,
                modo_escudo: 'desativado',
                config_alerta_agua: 120,
                altura_cm: altura,
                altura: altura, // Também salva como 'altura' para compatibilidade
                peso_kg: peso,
                peso: peso, // Também salva como 'peso' para compatibilidade
                updated_at: new Date().toISOString()
            }])
            .select();
        
        if (error) {
            console.error('Erro ao criar perfil:', error);
            // Mensagens mais específicas para erros comuns
            if (error.code === '23505') {
                throw new Error('Este perfil já existe. Tente fazer login novamente.');
            } else if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('403')) {
                throw new Error('Sem permissão para criar perfil. Verifique as políticas RLS no Supabase.');
            } else if (error.message?.includes('406') || error.code === 'PGRST116') {
                throw new Error('Formato de requisição inválido. Verifique a estrutura da tabela profiles.');
            } else if (error.message) {
                throw new Error(`Erro ao criar perfil: ${error.message}`);
            }
            throw error;
        }
        
        if (profileData && profileData.length > 0) {
            console.log('%c✨ Personagem criado com sucesso!', 'color: #10b981; font-weight: bold;');
            console.log('%c👤 ID do usuário:', 'color: #6366f1; font-weight: bold;', user.id);
            console.log('%c🎮 Classe:', 'color: #6366f1; font-weight: bold;', classeSelecionada);
            console.log('%c📊 Perfil criado:', 'color: #10b981; font-weight: bold;', profileData[0]);
        } else {
            throw new Error('Perfil não foi criado corretamente');
        }
        
        // Carrega perfil do usuário
        await carregarPerfilUsuario();
        
        // Dispara confetti
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#fbbf24', '#fcd34d', '#fde047', '#fef08a']
            });
        }
        
        // Esconde tela de criação
        const creationScreen = document.getElementById('characterCreationScreen');
        if (creationScreen) {
            creationScreen.style.transition = 'opacity 0.5s ease-out';
            creationScreen.style.opacity = '0';
            
            setTimeout(() => {
                creationScreen.classList.add('hidden');
                
                // Mostra app com fade-in
                const appContainer = document.getElementById('app-container');
                if (appContainer) {
                    appContainer.classList.remove('hidden');
                    appContainer.style.opacity = '0';
                    appContainer.style.transition = 'opacity 0.5s ease-in';
                    
                    // Força reflow
                    void appContainer.offsetWidth;
                    
                    setTimeout(() => {
                        appContainer.style.opacity = '1';
                    }, 50);
                }
                
                // Inicializa app
                inicializarApp();
                
                // Navega para Dashboard (missões) após animação
                setTimeout(() => {
                    if (window.navigationSystem) {
                        window.navigationSystem.navigateTo('missions');
                    }
                }, 600);
            }, 500);
        } else {
            // Fallback se não houver animação
            const appContainer = document.getElementById('app-container');
            if (appContainer) appContainer.classList.remove('hidden');
            inicializarApp();
            
            // Navega para Dashboard
            setTimeout(() => {
                if (window.navigationSystem) {
                    window.navigationSystem.navigateTo('missions');
                }
            }, 100);
        }
        
    } catch (error) {
        console.error('Erro ao sincronizar realidade:', error);
        if (messageEl) {
            messageEl.textContent = error.message || 'Erro ao criar personagem. Tente novamente.';
            messageEl.className = 'text-center text-sm text-red-400';
            messageEl.classList.remove('hidden');
        }
        finalizarBtn.disabled = false;
        finalizarBtn.textContent = 'Sincronizar Realidade';
    }
}

window.enviarMagicLink = enviarMagicLink;
window.selecionarClasse = selecionarClasse;
window.criarPersonagem = criarPersonagem;
window.sincronizarRealidade = sincronizarRealidade;

// ============================================
// SISTEMA DE CELEBRAÇÃO COM CONFETES
// ============================================

/**
 * Dispara uma celebração com confetes quando uma missão é completada
 * @param {Object} mission - Objeto da missão completada
 */
function celebrarConclusao(mission) {
    // Verifica se canvas-confetti está disponível
    if (typeof confetti === 'undefined') {
        console.warn('Canvas-confetti não está disponível');
        return;
    }

    // Verifica se a missão é de Alta Energia (tem Cristais de Foco)
    const isAltaEnergia = mission.crystalReward && mission.crystalReward > 0;
    
    // Configuração base para confetes na parte inferior
    const confettiConfig = {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.9 }, // Origem na parte inferior (90% da altura)
        gravity: 0.8,
        ticks: 200,
        decay: 0.94
    };

    if (isAltaEnergia) {
        // Confetes dourados para missões de Alta Energia
        const goldColors = ['#FFD700', '#FFA500', '#FF8C00', '#FFB347', '#FFD700'];
        
        // Dispara confetes dourados múltiplas vezes para efeito mais impactante
        confetti({
            ...confettiConfig,
            colors: goldColors,
            particleCount: 150,
            spread: 80,
            startVelocity: 30
        });

        // Segundo disparo com delay para efeito em camadas
        setTimeout(() => {
            confetti({
                ...confettiConfig,
                colors: goldColors,
                particleCount: 100,
                spread: 60,
                origin: { y: 0.85 },
                startVelocity: 25
            });
        }, 200);

        // Terceiro disparo para efeito de chuva
        setTimeout(() => {
            confetti({
                ...confettiConfig,
                colors: goldColors,
                particleCount: 80,
                spread: 50,
                origin: { y: 0.95 },
                startVelocity: 20
            });
        }, 400);
    } else {
        // Confetes coloridos padrão para missões normais
        const defaultColors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
        
        confetti({
            ...confettiConfig,
            colors: defaultColors,
            particleCount: 100,
            spread: 70
        });

        // Segundo disparo para efeito mais duradouro
        setTimeout(() => {
            confetti({
                ...confettiConfig,
                colors: defaultColors,
                particleCount: 60,
                spread: 50,
                origin: { y: 0.92 }
            });
        }, 300);
    }

    // Dispara vibração de sucesso (mobile)
    if (window.dispararVibracaoSucesso) {
        window.dispararVibracaoSucesso();
    }
}

// ============================================
// SISTEMA DE PONTOS
// ============================================

// Sistema de Pontos
class PointsSystem {
    constructor() {
        this.points = this.loadPoints();
        this.updatePointsDisplay();
        // Inicializa nível e XP
        this.updateLevelAndXP();
    }

    loadPoints() {
        const saved = localStorage.getItem('userPoints');
        return saved ? parseInt(saved, 10) : 0;
    }

    savePoints() {
        localStorage.setItem('userPoints', this.points.toString());
        this.updatePointsDisplay();
    }

    addPoints(amount, categoria = null) {
        // Aplica bônus de classe
        let pontosFinais = amount;
        
        if (categoria && window.userProfile && window.userProfile.classe === 'O Hiperfocado') {
            // +20% XP em tarefas de Foco (estudo/trabalho)
            if (categoria === 'Foco' || categoria === 'Trabalho' || categoria === 'Estudo') {
                pontosFinais = Math.floor(amount * 1.2);
                console.log('%c🎯 Bônus Hiperfocado: +20% XP', 'color: #3b82f6; font-weight: bold;', `+${pontosFinais - amount} XP`);
            }
        }
        
        this.points += pontosFinais;
        this.savePoints();
        this.showPointsAnimation(pontosFinais);
    }

    spendPoints(amount) {
        if (this.points >= amount) {
            this.points -= amount;
            this.savePoints();
            return true;
        }
        return false;
    }

    getPoints() {
        return this.points;
    }

    updatePointsDisplay() {
        const display = document.getElementById('pointsDisplay');
        if (display) {
            display.textContent = this.points.toLocaleString('pt-BR');
        }
        // Atualiza nível e XP baseado nos pontos
        this.updateLevelAndXP();
    }
    
    // Calcula nível e XP baseado nos pontos
    // Fórmula: XP necessário = nível * 100
    updateLevelAndXP() {
        let level = 1;
        let xpNecessario = 100;
        let xpAtual = this.points;
        
        // Calcula o nível atual
        while (xpAtual >= xpNecessario) {
            xpAtual -= xpNecessario;
            level++;
            xpNecessario = level * 100;
        }
        
        // Atualiza displays
        const levelEl = document.getElementById('userLevel');
        const xpDisplayEl = document.getElementById('xpDisplay');
        const xpBarEl = document.getElementById('xpBar');
        
        if (levelEl) levelEl.textContent = level;
        if (xpDisplayEl) {
            xpDisplayEl.textContent = `${xpAtual.toLocaleString('pt-BR')} / ${xpNecessario.toLocaleString('pt-BR')} XP`;
        }
        if (xpBarEl) {
            const porcentagem = (xpAtual / xpNecessario) * 100;
            xpBarEl.style.width = `${Math.min(porcentagem, 100)}%`;
        }
    }

    showPointsAnimation(amount) {
        const display = document.getElementById('pointsDisplay');
        if (display) {
            display.style.transform = 'scale(1.2)';
            display.style.color = '#10b981';
            setTimeout(() => {
                display.style.transform = 'scale(1)';
                display.style.color = '';
            }, 300);
        }
    }
}

// Sistema de Missões
class MissionsSystem {
    constructor(pointsSystem) {
        this.pointsSystem = pointsSystem;
        this.missions = this.loadMissions();
        
        // Se não houver missões salvas, adiciona as padrão
        if (this.missions.length === 0) {
            this.missions = this.getDefaultMissions();
            this.saveMissions();
        }
        
        // Para todos os timers ao inicializar (segurança)
        this.missions.forEach(mission => {
            if (mission.type === 'timer' && mission.isRunning) {
                mission.isRunning = false;
            }
        });
        this.saveMissions();
        
        this.renderMissions();
    }

    loadMissions() {
        const saved = localStorage.getItem('dailyMissions');
        const missions = saved ? JSON.parse(saved) : [];
        
        // Garante que todas as missões tenham as propriedades necessárias
        return missions.map(mission => ({
            ...mission,
            completed: mission.completed || false,
            type: mission.type || 'checklist',
            progress: mission.progress || 0,
            timeElapsed: mission.timeElapsed || 0,
            isRunning: false,
            completedDate: mission.completedDate || null
        }));
    }

    getDefaultMissions() {
        return [
            // Missões de Checklist (Simples) - Verde para Saúde
            {
                id: 1,
                title: 'Escovar os dentes',
                description: 'Escove os dentes pela manhã',
                type: 'checklist',
                reward: 5,
                completed: false,
                completedDate: null,
                icon: '🦷',
                color: 'green'
            },
            {
                id: 2,
                title: 'Comer uma refeição saudável',
                description: 'Faça uma refeição nutritiva',
                type: 'checklist',
                reward: 5,
                completed: false,
                completedDate: null,
                icon: '🥗',
                color: 'green'
            },
            {
                id: 3,
                title: 'Lavar a louça',
                description: 'Lave a louça após as refeições',
                type: 'checklist',
                reward: 5,
                completed: false,
                completedDate: null,
                icon: '🧽',
                color: 'orange'
            },
            // Missão de Contador (Progressiva) - Azul para Hidratação
            {
                id: 4,
                title: 'Beber 2L de Água',
                description: 'Beba água ao longo do dia',
                type: 'counter',
                reward: 2,
                target: 2000,
                progress: 0,
                completed: false,
                completedDate: null,
                icon: '💧',
                color: 'blue'
            },
            // Missão de Tempo (Timer) - Laranja para Limpeza
            {
                id: 5,
                title: 'Organizar a casa (10 min)',
                description: 'Organize sua casa por 10 minutos',
                type: 'timer',
                reward: 15,
                crystalReward: 1,
                duration: 600,
                timeElapsed: 0,
                isRunning: false,
                completed: false,
                completedDate: null,
                icon: '🏠',
                color: 'orange'
            }
        ];
    }

    saveMissions() {
        localStorage.setItem('dailyMissions', JSON.stringify(this.missions));
    }

    completeMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.completed) return false;

        // Para missões do tipo timer ou counter, não completa diretamente
        if (mission.type === 'timer' || mission.type === 'counter') {
            return false;
        }

        // Missões de checklist
        if (mission.type === 'checklist' || !mission.type) {
            mission.completed = true;
            mission.completedDate = new Date().toISOString();
            // Aplica bônus de classe (O Hiperfocado: +20% XP em Foco)
            const categoria = mission.category || mission.color || '';
            this.pointsSystem.addPoints(mission.reward, categoria);
            this.saveMissions();
            
            // Celebração com confetes
            celebrarConclusao(mission);
            
            this.renderMissions();
            
            // Salva no Supabase
            completarMissao(missionId, mission, 'daily');
            
            return true;
        }
        return false;
    }

    addWaterProgress(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'counter' || mission.completed) return;

        mission.progress = (mission.progress || 0) + 250;
        this.saveMissions();
        
        // Adiciona pontos por cada 250ml (Explorador do Caos: bônus aleatório)
        let pontos = mission.reward || 2;
        if (window.userProfile && window.userProfile.classe === 'Explorador do Caos') {
            // Bônus aleatório de 0 a 3 pontos extras
            const bonus = Math.floor(Math.random() * 4);
            pontos += bonus;
            if (bonus > 0) {
                console.log('%c🌿 Bônus do Caos:', 'color: #10b981; font-weight: bold;', `+${bonus} pontos extras!`);
            }
        }
        this.pointsSystem.addPoints(pontos, 'Rotina');
        
        // Verifica se completou a meta
        if (mission.progress >= mission.target) {
            mission.completed = true;
            mission.completedDate = new Date().toISOString();
            
            // Celebração com confetes
            celebrarConclusao(mission);
            
            // Salva no Supabase quando completa
            completarMissao(missionId, mission, 'daily');
        }
        
        this.renderMissions();
    }

    startTimer(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'timer' || mission.completed || mission.isRunning) return;

        const alreadyElapsed = mission.timeElapsed || 0;
        mission.isRunning = true;
        mission.startTime = Date.now() - (alreadyElapsed * 1000);
        this.saveMissions();
        this.renderMissions();

        const timerInterval = setInterval(() => {
            const mission = this.missions.find(m => m.id === missionId);
            if (!mission || !mission.isRunning) {
                clearInterval(timerInterval);
                return;
            }

            const elapsed = Math.floor((Date.now() - mission.startTime) / 1000);
            mission.timeElapsed = elapsed;
            
            if (elapsed >= mission.duration) {
                mission.completed = true;
                mission.isRunning = false;
                mission.completedDate = new Date().toISOString();
                mission.timeElapsed = mission.duration;
                this.saveMissions();
                
                // Adiciona recompensas
                this.pointsSystem.addPoints(mission.reward || 15);
                // Nota: crystalReward não é usado no sistema de pontos, mas mantemos para compatibilidade
                
                // Celebração com confetes (dourados se tiver crystalReward)
                celebrarConclusao(mission);
                
                // Salva no Supabase quando completa
                completarMissao(missionId, mission, 'daily');
                
                clearInterval(timerInterval);
            }
            
            this.renderMissions();
        }, 1000);
    }

    stopTimer(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'timer' || !mission.isRunning) return;

        if (mission.startTime) {
            const elapsed = Math.floor((Date.now() - mission.startTime) / 1000);
            mission.timeElapsed = (mission.timeElapsed || 0) + elapsed;
        }
        
        mission.isRunning = false;
        delete mission.startTime;
        this.saveMissions();
        this.renderMissions();
    }

    undoMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || !mission.completed) return;

        // Para timer, para o timer se estiver rodando
        if (mission.type === 'timer' && mission.isRunning) {
            this.stopTimer(missionId);
        }

        // Remove a marcação de concluída
        mission.completed = false;
        mission.completedDate = null;
        
        // Reverte recompensas baseado no tipo
        if (mission.type === 'timer') {
            this.pointsSystem.spendPoints(mission.reward || 15);
            mission.timeElapsed = 0;
            mission.isRunning = false;
        } else if (mission.type === 'counter') {
            // Para counter, reverte toda a energia ganha
            const increments = Math.floor((mission.progress || 0) / 250);
            this.pointsSystem.spendPoints(increments * (mission.reward || 2));
            mission.progress = 0;
        } else {
            // Checklist
            this.pointsSystem.spendPoints(mission.reward || 5);
        }
        
        // Garante que os pontos não fiquem negativos
        if (this.pointsSystem.getPoints() < 0) {
            this.pointsSystem.points = 0;
            this.pointsSystem.savePoints();
        }
        
        this.saveMissions();
        this.renderMissions();
    }

    resetDailyMissions() {
        // Verifica se o Escudo de Rotina está ativo
        if (escudoRotinaAtivo) {
            console.log('%c🛡️ Reset de missões bloqueado pelo Escudo de Rotina', 'color: #10b981; font-weight: bold;');
            return; // Não reseta missões durante evento
        }
        
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('lastMissionReset');
        
        if (lastReset !== today) {
            this.missions.forEach(mission => {
                mission.completed = false;
                mission.completedDate = null;
                if (mission.type === 'counter') {
                    mission.progress = 0;
                }
                if (mission.type === 'timer') {
                    mission.timeElapsed = 0;
                    mission.isRunning = false;
                    if (mission.startTime) {
                        delete mission.startTime;
                    }
                }
            });
            localStorage.setItem('lastMissionReset', today);
            this.saveMissions();
            this.renderMissions();
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    renderMissions() {
        const container = document.getElementById('missionsContainer');
        if (!container) return;

        // Otimização: Usa requestAnimationFrame para evitar bloqueio da UI
        if (this._renderTimeout) {
            clearTimeout(this._renderTimeout);
        }
        
        this._renderTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                container.innerHTML = '';

                // Identifica a missão mais importante (primeira não completada ou a de maior recompensa)
                const incompleteMissions = this.missions.filter(m => !m.completed);
                const mostImportantMission = incompleteMissions.length > 0 
                    ? incompleteMissions.reduce((prev, current) => 
                        (current.reward || 0) > (prev.reward || 0) ? current : prev
                      )
                    : null;

                // Limita renderização a 50 missões por vez para performance
                const maxMissions = 50;
                const missionsToRender = this.missions.slice(0, maxMissions);

                missionsToRender.forEach(mission => {
                    const card = document.createElement('div');
                    // Usa cinza muito escuro (#121212) para o fundo do card
                    const bgColor = 'bg-[#121212]';
                    
                    // Define borda colorida baseada na categoria/cor da missão
                    let borderColor = 'border-gray-800';
                    let borderClass = '';
                    if (mission.color === 'green') {
                        borderColor = 'border-green';
                        borderClass = 'border-green';
                    } else if (mission.color === 'blue') {
                        borderColor = 'border-blue';
                        borderClass = 'border-blue';
                    } else if (mission.color === 'orange') {
                        borderColor = 'border-orange';
                        borderClass = 'border-orange';
                    }
                    
                    // Borda fina (1px) com cor da categoria
                    const isMostImportant = mostImportantMission && mission.id === mostImportantMission.id;
                    
                    card.className = `w-full ${bgColor} ${borderClass} border rounded-2xl p-5 shadow-lg card-touchable ${mission.completed ? 'opacity-60' : ''}`;
                    card.style.borderWidth = '1px';
                    card.style.backgroundColor = '#121212';

                    if (mission.type === 'checklist') {
                        card.innerHTML = this.renderChecklistCard(mission);
                    } else if (mission.type === 'counter') {
                        card.innerHTML = this.renderCounterCard(mission);
                    } else if (mission.type === 'timer') {
                        card.innerHTML = this.renderTimerCard(mission);
                    } else {
                        card.innerHTML = this.renderChecklistCard(mission);
                    }

                    container.appendChild(card);
                });
            });
        }, 10); // Debounce de 10ms
    }

    renderChecklistCard(mission) {
        const icon = mission.icon || '✓';
        const isMostImportant = this.isMostImportantMission(mission);
        
        if (mission.completed) {
            return `
                <div class="flex items-start gap-3 mb-4">
                    <span class="text-2xl">${icon}</span>
                    <div class="flex-1">
                        <h3 class="font-semibold text-white mb-1 line-through opacity-70">${mission.title}</h3>
                        <p class="text-sm text-gray-400">${mission.description}</p>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                    <span class="text-sm text-gray-400">⚡ +${mission.reward} pontos</span>
                    <button class="bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-xl font-medium transition-colors btn-min-height" onclick="missionsSystem.undoMission(${mission.id})">
                        ↶ Desfazer
                    </button>
                </div>
            `;
        }
        return `
            <div class="flex items-start gap-3 mb-4">
                <span class="text-2xl">${icon}</span>
                <div class="flex-1">
                    <h3 class="font-semibold text-white mb-1">${mission.title}</h3>
                    <p class="text-sm text-gray-400">${mission.description}</p>
                </div>
            </div>
            <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                <span class="text-sm text-gray-400">⚡ +${mission.reward} pontos</span>
                <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-medium transition-colors btn-min-height ${isMostImportant ? 'btn-pulse' : ''}" onclick="missionsSystem.completeMission(${mission.id})">
                    ✓ Concluir
                </button>
            </div>
        `;
    }
    
    isMostImportantMission(mission) {
        if (mission.completed) return false;
        const incompleteMissions = this.missions.filter(m => !m.completed);
        if (incompleteMissions.length === 0) return false;
        const mostImportant = incompleteMissions.reduce((prev, current) => 
            (current.reward || 0) > (prev.reward || 0) ? current : prev
        );
        return mostImportant.id === mission.id;
    }

    renderCounterCard(mission) {
        const progress = mission.progress || 0;
        const target = mission.target || 2000;
        const percentage = Math.min((progress / target) * 100, 100);
        const icon = mission.icon || '💧';
        const isMostImportant = this.isMostImportantMission(mission);
        
        if (mission.completed) {
            return `
                <div class="flex items-start gap-3 mb-4">
                    <span class="text-2xl">${icon}</span>
                    <div class="flex-1">
                        <h3 class="font-semibold text-white mb-1 line-through opacity-70">${mission.title}</h3>
                        <p class="text-sm text-gray-400">${mission.description}</p>
                    </div>
                </div>
                <div class="mb-4">
                    <div class="flex justify-between text-xs text-gray-400 mb-2">
                        <span>${(progress/1000).toFixed(1)}L / ${(target/1000).toFixed(1)}L</span>
                        <span>100%</span>
                    </div>
                    <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 rounded-full" style="width: 100%"></div>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                    <span class="text-sm text-gray-400">⚡ +${Math.floor(progress/250) * mission.reward} pontos</span>
                    <button class="bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-xl font-medium transition-colors btn-min-height" onclick="missionsSystem.undoMission(${mission.id})">
                        ↶ Desfazer
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="flex items-start gap-3 mb-4">
                <span class="text-2xl">${icon}</span>
                <div class="flex-1">
                    <h3 class="font-semibold text-white mb-1">${mission.title}</h3>
                    <p class="text-sm text-gray-400">${mission.description}</p>
                </div>
            </div>
            <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-400 mb-2">
                    <span>${(progress/1000).toFixed(1)}L / ${(target/1000).toFixed(1)}L</span>
                    <span>${Math.round(percentage)}%</span>
                </div>
                <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div class="h-full bg-blue-500 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                </div>
                <button 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition-colors btn-min-height card-touchable ${isMostImportant ? 'btn-pulse' : ''}" 
                    onclick="missionsSystem.addWaterProgress(${mission.id})"
                >
                    + 250ml (+${mission.reward} ⚡)
                </button>
            </div>
            <div class="pt-4 border-t border-gray-800">
                <span class="text-sm text-gray-400">⚡ +${mission.reward} pontos por 250ml</span>
            </div>
        `;
    }

    renderTimerCard(mission) {
        const icon = mission.icon || '⏱️';
        const timeElapsed = mission.timeElapsed || 0;
        const duration = mission.duration || 600;
        const remaining = Math.max(0, duration - timeElapsed);
        const percentage = (timeElapsed / duration) * 100;
        const isMostImportant = this.isMostImportantMission(mission);
        
        if (mission.completed) {
            return `
                <div class="flex items-start gap-3 mb-4">
                    <span class="text-2xl">${icon}</span>
                    <div class="flex-1">
                        <h3 class="font-semibold text-white mb-1 line-through opacity-70">${mission.title}</h3>
                        <p class="text-sm text-gray-400">${mission.description}</p>
                    </div>
                </div>
                <div class="mb-4">
                    <div class="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Tempo: ${this.formatTime(duration)}</span>
                        <span class="text-green-400">Completo!</span>
                    </div>
                    <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div class="h-full bg-green-500 rounded-full" style="width: 100%"></div>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                    <span class="text-sm text-gray-400">⚡ +${mission.reward} pontos ${mission.crystalReward ? '💎 +' + mission.crystalReward + ' cristal' : ''}</span>
                    <button class="bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded-xl font-medium transition-colors btn-min-height" onclick="missionsSystem.undoMission(${mission.id})">
                        ↶ Desfazer
                    </button>
                </div>
            `;
        }
        
        const isRunning = mission.isRunning || false;
        
        return `
            <div class="flex items-start gap-3 mb-4">
                <span class="text-2xl">${icon}</span>
                <div class="flex-1">
                    <h3 class="font-semibold text-white mb-1">${mission.title}</h3>
                    <p class="text-sm text-gray-400">${mission.description}</p>
                </div>
            </div>
            <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Tempo restante: ${this.formatTime(remaining)}</span>
                    <span>${Math.round(percentage)}%</span>
                </div>
                <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div class="h-full bg-orange-500 rounded-full transition-all duration-1000" style="width: ${percentage}%"></div>
                </div>
                ${!isRunning ? `
                    <button 
                        class="w-full bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-medium transition-colors btn-min-height card-touchable ${isMostImportant ? 'btn-pulse' : ''}" 
                        onclick="missionsSystem.startTimer(${mission.id})"
                    >
                        ▶ Iniciar Timer
                    </button>
                ` : `
                    <button 
                        class="w-full bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-medium transition-colors btn-min-height card-touchable" 
                        onclick="missionsSystem.stopTimer(${mission.id})"
                    >
                        ⏸ Pausar Timer
                    </button>
                `}
            </div>
            <div class="pt-4 border-t border-gray-800">
                <span class="text-sm text-gray-400">⚡ +${mission.reward} pontos ${mission.crystalReward ? '💎 +' + mission.crystalReward + ' cristal' : ''}</span>
            </div>
        `;
    }
}

// Sistema de Loja
class ShopSystem {
    constructor(pointsSystem) {
        this.pointsSystem = pointsSystem;
        this.rewards = this.loadRewards();
        this.purchasedItems = this.loadPurchasedItems();
        this.renderShop();
    }

    loadRewards() {
        return [
            {
                id: 1,
                icon: '🎁',
                title: 'Cupom 10% OFF',
                description: 'Desconto de 10% na próxima compra',
                price: 100
            },
            {
                id: 2,
                icon: '⭐',
                title: 'Badge Especial',
                description: 'Badge exclusivo para seu perfil',
                price: 150
            },
            {
                id: 3,
                icon: '🎨',
                title: 'Tema Personalizado',
                description: 'Desbloqueie um tema exclusivo',
                price: 200
            },
            {
                id: 4,
                icon: '🏆',
                title: 'Troféu de Ouro',
                description: 'Exiba seu troféu no perfil',
                price: 300
            },
            {
                id: 5,
                icon: '💎',
                title: 'Acesso VIP',
                description: 'Acesso a recursos exclusivos por 7 dias',
                price: 500
            },
            {
                id: 6,
                icon: '🎯',
                title: 'Multiplicador x2',
                description: 'Dobre seus pontos por 24 horas',
                price: 250
            }
        ];
    }

    loadPurchasedItems() {
        const saved = localStorage.getItem('purchasedItems');
        return saved ? JSON.parse(saved) : [];
    }

    savePurchasedItems() {
        localStorage.setItem('purchasedItems', JSON.stringify(this.purchasedItems));
    }

    purchaseReward(rewardId) {
        const reward = this.rewards.find(r => r.id === rewardId);
        if (!reward) return false;

        if (this.purchasedItems.includes(rewardId)) {
            alert('Você já possui este item!');
            return false;
        }

        if (this.pointsSystem.spendPoints(reward.price)) {
            this.purchasedItems.push(rewardId);
            this.savePurchasedItems();
            this.renderShop();
            alert(`Parabéns! Você adquiriu: ${reward.title}`);
            return true;
        } else {
            alert('Pontos insuficientes! Complete mais missões para ganhar pontos.');
            return false;
        }
    }

    renderShop() {
        const container = document.getElementById('shopContainer');
        if (!container) return;

        container.innerHTML = '';
        const currentPoints = this.pointsSystem.getPoints();

        this.rewards.forEach(reward => {
            const isPurchased = this.purchasedItems.includes(reward.id);
            const canAfford = currentPoints >= reward.price;

            const card = document.createElement('div');
            card.className = `w-full border border-gray-800 rounded-2xl p-5 shadow-lg card-touchable ${isPurchased ? 'opacity-60' : ''}`;
            card.style.backgroundColor = '#121212';
            card.style.borderWidth = '1px';

            card.innerHTML = `
                <div class="flex items-start gap-4 mb-4">
                    <span class="text-4xl">${reward.icon}</span>
                    <div class="flex-1">
                        <h3 class="font-semibold text-white mb-1">${reward.title}</h3>
                        <p class="text-sm text-gray-400">${reward.description}</p>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">💰</span>
                        <span class="font-semibold text-white">${reward.price}</span>
                    </div>
                    ${isPurchased 
                        ? '<span class="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium">Adquirido</span>'
                        : `<button 
                             class="bg-indigo-600 hover:bg-indigo-700 ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''} text-white px-5 py-3 rounded-xl font-medium transition-colors btn-min-height" 
                             onclick="shopSystem.purchaseReward(${reward.id})"
                             ${!canAfford ? 'disabled' : ''}>
                            Comprar
                           </button>`
                    }
                </div>
            `;

            container.appendChild(card);
        });
    }
}

// Sistema de Navegação
class NavigationSystem {
    constructor() {
        this.currentPage = 'missions';
        this.init();
    }

    init() {
        const navButtons = document.querySelectorAll('.nav-bottom-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.getAttribute('data-page');
                if (page) {
                    this.navigateTo(page);
                }
            });
        });
    }

    navigateTo(page) {
        // Mapeia páginas antigas para novas
        const pageMap = {
            'missions': 'missions',
            'shop': 'inventory',
            'board': 'profile',
            'dashboard': 'dashboard',
            'inventory': 'inventory',
            'stats': 'stats',
            'profile': 'profile',
            'alquimia': 'dashboard' // Alquimia agora está no Dashboard
        };
        
        const targetPage = pageMap[page] || page;
        this.currentPage = targetPage;

        // Atualiza botões de navegação (bottom nav) com estado ativo
        document.querySelectorAll('.nav-bottom-btn').forEach(btn => {
            const btnPage = btn.getAttribute('data-page');
            if (btnPage === targetPage) {
                // Botão ativo: cor índigo, opacidade total, escala maior
                btn.classList.add('active');
                btn.classList.remove('text-gray-500');
                btn.classList.add('text-indigo-400');
            } else {
                // Botão inativo: cor cinza, opacidade reduzida
                btn.classList.remove('active');
                btn.classList.remove('text-indigo-400');
                btn.classList.add('text-gray-500');
            }
        });

        // Atualiza páginas (esconde/mostra)
        const pages = {
            'dashboard': document.getElementById('dashboard-page'),
            'missions': document.getElementById('missions-page'),
            'inventory': document.getElementById('inventory-page'),
            'stats': document.getElementById('stats-page'),
            'profile': document.getElementById('profile-page'),
            'alquimia': document.getElementById('alquimia-page') // Mantido para compatibilidade
        };
        
        // Seções especiais
        const manutencaoSection = document.getElementById('manutencao-corporal-section');
        const instantActionsSection = document.getElementById('instant-actions-section');

        Object.keys(pages).forEach(pageKey => {
            const pageEl = pages[pageKey];
            if (pageEl) {
                if (pageKey === targetPage) {
                    pageEl.classList.remove('hidden');
                    pageEl.classList.add('page-visible');
                    
                    // Mostra seção de Manutenção Corporal na página de missões
                    if (pageKey === 'missions' && manutencaoSection) {
                        manutencaoSection.classList.remove('hidden');
                    } else if (manutencaoSection) {
                        manutencaoSection.classList.add('hidden');
                    }
                    
                    // Esconde seção de ações instantâneas antiga (os widgets agora estão fixos na página de missões)
                    if (instantActionsSection) {
                        instantActionsSection.classList.add('hidden');
                    }
                    
                    // Atualiza perfil quando navegar para a página
                    if (pageKey === 'profile') {
                        atualizarPaginaPerfil();
                    }
                    
                    // Carrega dados sob demanda quando navegar para dashboard
                    if (pageKey === 'dashboard') {
                        // Carregamento sob demanda - apenas quando necessário
                        if (!dashboardDataLoaded) {
                            carregarMedicamentos();
                            dashboardDataLoaded = true;
                        }
                        atualizarBarrasStatusRPG();
                        atualizarAtributosManutencao();
                        // Mostra aba de Alquimia por padrão
                        mostrarAbaDashboard('alquimia');
                    }
                    
                    // Carrega medicamentos quando navegar para alquimia (compatibilidade)
                    if (pageKey === 'alquimia') {
                        const isLoaded = window.dashboardDataLoaded || dashboardDataLoaded;
                        if (!isLoaded) {
                            carregarMedicamentos();
                            dashboardDataLoaded = true;
                            window.dashboardDataLoaded = true;
                        }
                    }
                    
                    // Carrega missões sob demanda quando navegar para Quests
                    if (pageKey === 'missions') {
                        const missionsContainer = document.getElementById('missionsContainer');
                        if (missionsContainer) {
                            missionsContainer.style.display = 'block';
                            // Renderiza missões apenas quando necessário
                            const isLoaded = window.missionsDataLoaded || missionsDataLoaded;
                            if (!isLoaded && missionsBoard && typeof missionsBoard.renderMissions === 'function') {
                                missionsBoard.renderMissions();
                                missionsDataLoaded = true;
                                window.missionsDataLoaded = true;
                            }
                        }
                    } else {
                        // Esconde missões quando não está na aba Quests
                        const missionsContainer = document.getElementById('missionsContainer');
                        if (missionsContainer) {
                            missionsContainer.style.display = 'none';
                        }
                    }
                } else {
                    pageEl.classList.add('hidden');
                    pageEl.classList.remove('page-visible');
                }
            }
        });

        // Mostra/esconde botão flutuante
        // Botão FAB agora é usado para adicionar missões
        // Nota: addMissionBtn pode não existir, então verificamos antes de usar
        const addBtn = document.getElementById('addMissionBtn');
        if (addBtn) {
            if (targetPage === 'profile') {
                addBtn.classList.remove('hidden');
            } else {
                addBtn.classList.add('hidden');
            }
        }

        // Atualiza sistemas quando navegar
        if (targetPage === 'inventory' && window.shopSystem) {
            window.shopSystem.renderShop();
        }
        
        if (targetPage === 'profile' && window.missionsBoard) {
            window.missionsBoard.renderMissions();
            window.missionsBoard.updateCounters();
        }
        
        if (targetPage === 'stats' && window.dashboardSystem) {
            window.dashboardSystem.loadDashboard();
            // Atualiza indicador de escudo ao navegar para dashboard
            atualizarIndicadorEscudo();
            // Atualiza dados corporais na página de estatísticas
            atualizarPaginaStats();
        }
        
        // Dispara vibração ao trocar de página (mobile)
        if (window.dispararVibracaoSucesso) {
            window.dispararVibracaoSucesso();
        }
    }
}

// Sistema de Dashboard
class DashboardSystem {
    constructor() {
        this.chart = null;
        this.init();
    }

    init() {
        // Não carrega automaticamente - será carregado quando navegar para a aba
    }

    async loadDashboard() {
        const loadingEl = document.getElementById('dashboardLoading');
        const emptyEl = document.getElementById('dashboardEmpty');
        const chartCard = document.querySelector('.chart-card');
        const streakCard = document.querySelector('.streak-card');

        // Mostra loading
        if (loadingEl) loadingEl.classList.remove('hidden');
        if (emptyEl) emptyEl.classList.add('hidden');
        if (chartCard) chartCard.style.display = 'none';
        if (streakCard) streakCard.style.display = 'none';

        try {
            // Tenta carregar dados do Supabase
            let dados = null;
            try {
                dados = await carregarProgressoMensal();
            } catch (error) {
                console.warn('%c⚠️ Erro ao carregar do Supabase, tentando cache offline...', 'color: #f59e0b; font-weight: bold;', error);
            }
            
            // Se não houver dados online, tenta usar cache offline
            if (!dados || dados.length === 0) {
                console.log('%c📦 Tentando carregar dados do cache offline...', 'color: #6366f1; font-weight: bold;');
                const dadosCacheados = await obterMissoesCacheadas();
                if (dadosCacheados && dadosCacheados.length > 0) {
                    dados = dadosCacheados;
                    console.log('%c✅ Dados carregados do cache offline', 'color: #10b981; font-weight: bold;');
                }
            } else {
                // Cacheia os dados para uso offline
                cachearMissoesParaOffline(dados);
            }
            
            if (!dados || dados.length === 0) {
                // Mostra estado vazio
                if (loadingEl) loadingEl.classList.add('hidden');
                if (emptyEl) emptyEl.classList.remove('hidden');
                return;
            }

            // Processa dados e renderiza
            this.processarDados(dados);
            
            // Esconde loading
            if (loadingEl) loadingEl.classList.add('hidden');
            if (chartCard) chartCard.style.display = 'block';
            if (streakCard) streakCard.style.display = 'flex';
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            if (loadingEl) loadingEl.classList.add('hidden');
            if (emptyEl) emptyEl.classList.remove('hidden');
        }
    }

    async processarDados(dados) {
        // Calcula energia por dia (últimos 7 dias)
        let energiaPorDia = this.calcularEnergiaPorDia(dados);
        
        // TRAVA DE DADOS: Limita rigorosamente a 20 itens ANTES de processar
        // Isso impede que o gráfico cresça infinitamente e trave a memória
        const dadosLimitados = energiaPorDia.slice(-20);
        
        // Calcula streak de Higiene/Saúde
        const streak = await this.calcularStreak(dados);
        
        // Atualiza UI com dados limitados
        this.atualizarStreak(streak);
        this.renderizarGrafico(dadosLimitados);
    }

    calcularEnergiaPorDia(dados) {
        // Filtra missões que dão energia
        // Do quadro de missões (origem: 'board') - todas dão energia
        // Das missões diárias (origem: 'daily') - também podem dar energia/pontos
        const atividadesComEnergia = dados.filter(item => 
            (item.origem === 'board' || item.origem === 'daily') && 
            (item.recompensa > 0 || item.pontuacao > 0)
        );

        // Cria objeto com os últimos 7 dias
        const ultimos7Dias = [];
        const hoje = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(data.getDate() - i);
            data.setHours(0, 0, 0, 0);
            
            const dataStr = getLocalDateString(data);
            
            // Soma energia do dia
            const energiaDoDia = atividadesComEnergia
                .filter(item => {
                    const itemDate = new Date(item.data_completada);
                    itemDate.setHours(0, 0, 0, 0);
                    return getLocalDateString(itemDate) === dataStr;
                })
                .reduce((total, item) => {
                    // Prioriza recompensa (energia do quadro), senão usa pontuacao
                    return total + (item.recompensa || item.pontuacao || 0);
                }, 0);
            
            ultimos7Dias.push({
                data: data,
                dataStr: dataStr,
                energia: energiaDoDia
            });
        }
        
        return ultimos7Dias;
    }

    async calcularStreak(dados) {
        // Filtra missões de Higiene ou Saúde
        const missoesHigieneSaude = dados.filter(item => {
            const categoria = (item.categoria || '').toLowerCase();
            const nomeMissao = (item.nome_missao || '').toLowerCase();
            
            // Verifica por categoria
            const categoriaValida = categoria === 'saúde' || 
                                   categoria === 'limpeza' ||
                                   categoria === 'higiene';
            
            // Verifica por palavras-chave no nome
            const palavrasChave = [
                'escovar', 'dente', 'dentes',
                'louça', 'lavar',
                'refeição', 'saudável', 'comer',
                'água', 'hidratação',
                'organizar', 'casa'
            ];
            
            const nomeValido = palavrasChave.some(palavra => nomeMissao.includes(palavra));
            
            return categoriaValida || nomeValido;
        });

        if (missoesHigieneSaude.length === 0) {
            return 0;
        }

        // Agrupa por dia
        const atividadesPorDia = {};
        missoesHigieneSaude.forEach(item => {
            const data = new Date(item.data_completada);
            data.setHours(0, 0, 0, 0);
            const dataStr = getLocalDateString(data);
            
            if (!atividadesPorDia[dataStr]) {
                atividadesPorDia[dataStr] = true;
            }
        });

        // Calcula dias consecutivos a partir de hoje
        let streak = 0;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Busca dias de recuperação no Supabase para não quebrar streak
        let diasRecuperacao = new Set();
        if (supabaseClient) {
            try {
                const { data } = await supabaseClient
                    .from('profiles')
                    .select('modo_escudo, escudo_expira_em, updated_at')
                    .eq('modo_escudo', 'recuperacao');
                
                if (data && data.length > 0) {
                    data.forEach(profile => {
                        if (profile.updated_at) {
                            const dataRecuperacao = new Date(profile.updated_at);
                            dataRecuperacao.setHours(0, 0, 0, 0);
                            diasRecuperacao.add(getLocalDateString(dataRecuperacao));
                        }
                    });
                }
            } catch (error) {
                console.warn('Erro ao buscar dias de recuperação:', error);
            }
        }
        
        for (let i = 0; i < 365; i++) { // Verifica até 1 ano atrás
            const dataVerificar = new Date(hoje);
            dataVerificar.setDate(hoje.getDate() - i);
            const dataStr = getLocalDateString(dataVerificar);
            
            if (atividadesPorDia[dataStr]) {
                streak++;
            } else if (diasRecuperacao.has(dataStr)) {
                // Dia de recuperação - não quebra a streak, mas não conta
                streak++;
            } else {
                break; // Quebra a sequência
            }
        }
        
        return streak;
    }

    atualizarStreak(streak) {
        const streakValueEl = document.getElementById('streakValue');
        if (streakValueEl) {
            streakValueEl.textContent = streak;
        }
    }

    renderizarGrafico(energiaPorDia) {
        // GRÁFICO TEMPORARIAMENTE DESABILITADO PARA ESTABILIZAR O APP
        // Substituído por texto simples para reduzir app_time_stats de 500ms para 16ms
        
        // Calcula energia total dos últimos dias
        const energiaTotal = energiaPorDia.length > 0
            ? energiaPorDia.reduce((total, item) => total + (item.energia || 0), 0)
            : 0;
        const energiaMedia = energiaPorDia.length > 0
            ? Math.round(energiaTotal / energiaPorDia.length)
            : 0;
        
        // Substitui o canvas do gráfico por texto simples
        const chartCard = document.querySelector('.chart-card');
        if (chartCard) {
            const canvas = chartCard.querySelector('canvas');
            if (canvas) {
                // Remove o canvas e substitui por texto simples
                canvas.remove();
                const energiaText = document.createElement('p');
                energiaText.className = 'text-2xl font-bold text-purple-400 text-center py-4';
                energiaText.textContent = `⚡ Energia Média: ${energiaMedia}%`;
                chartCard.appendChild(energiaText);
            }
        }
        
        // Destrói gráfico anterior se existir (limpa memória)
        if (this.chart) {
            try {
                this.chart.destroy();
                this.chart = null;
            } catch (e) {
                console.warn('Erro ao destruir gráfico:', e);
            }
        }
        
        return; // Para aqui - não renderiza mais o Chart.js
        
        /* CÓDIGO DO GRÁFICO COMENTADO TEMPORARIAMENTE PARA ESTABILIZAR O APP
        const ctx = document.getElementById('energyChart');
        if (!ctx) return;

        // Destrói gráfico anterior se existir
        if (this.chart) {
            this.chart.destroy();
        }

        // TRAVA DE DADOS: Limita rigorosamente a 20 pontos para evitar lag e erro de memória
        const dadosLimitados = energiaPorDia.slice(-20);

        // Prepara dados
        const labels = dadosLimitados.map(item => {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const itemDate = new Date(item.data);
            itemDate.setHours(0, 0, 0, 0);
            
            if (itemDate.getTime() === hoje.getTime()) {
                return 'Hoje';
            } else if (itemDate.getTime() === hoje.getTime() - 86400000) {
                return 'Ontem';
            } else {
                return itemDate.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
            }
        });

        const energiaData = dadosLimitados.map(item => item.energia);

        // Configuração do Chart.js com tema dark roxo/slate
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Energia Ganha',
                    data: energiaData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#8b5cf6',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#e2e8f0',
                        bodyColor: '#cbd5e1',
                        borderColor: '#8b5cf6',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `⚡ ${context.parsed.y} de energia`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100, // Fixa o valor máximo do eixo Y em 100
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return value + ' ⚡';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        */ // FIM DO CÓDIGO COMENTADO DO GRÁFICO
    }
}

// Sistema de Missões do Quadro
class MissionsBoard {
    constructor() {
        this.missions = this.loadMissions();
        this.energyTotal = this.loadEnergy();
        this.focusCrystals = this.loadCrystals();
        this.nextId = this.getNextId();
        
        // Timers para animações dos contadores
        this.energyTimer = null;
        this.crystalsTimer = null;
        
        this.init();
        // Atualiza displays no header ao inicializar
        this.updateCounters();
    }

    init() {
        // Para todos os timers ao inicializar (segurança)
        this.missions.forEach(mission => {
            if (mission.type === 'timer' && mission.isRunning) {
                mission.isRunning = false;
            }
        });
        this.saveMissions();
        
        // Reseta missões diárias se necessário
        this.resetDailyBoardMissions();
        
        this.updateCounters();
        this.renderMissions();
        this.setupEventListeners();
        
        // Adiciona missões diárias pré-definidas se não houver nenhuma
        if (this.missions.length === 0) {
            this.addExampleMissions();
        }
    }

    loadMissions() {
        const saved = localStorage.getItem('boardMissions');
        const missions = saved ? JSON.parse(saved) : [];
        
        // Garante que todas as missões tenham as propriedades necessárias
        return missions.map(mission => ({
            ...mission,
            completed: mission.completed || false,
            type: mission.type || 'checklist',
            progress: mission.progress || 0,
            timeElapsed: mission.timeElapsed || 0,
            isRunning: false // Sempre reseta timers ao carregar
        }));
    }

    saveMissions() {
        localStorage.setItem('boardMissions', JSON.stringify(this.missions));
    }

    resetDailyBoardMissions() {
        // Verifica se algum escudo está ativo (Rotina ou Recuperação)
        if (escudoRotinaAtivo || modoEscudoAtivo === 'recuperacao') {
            console.log('%c🛡️ Reset de missões do quadro bloqueado pelo Escudo', 'color: #10b981; font-weight: bold;');
            return; // Não reseta missões durante evento ou recuperação
        }
        
        const today = new Date().toDateString();
        const lastReset = localStorage.getItem('lastBoardMissionReset');
        
        if (lastReset !== today) {
            // Identifica missões diárias pré-definidas pelos nomes
            const dailyMissionNames = [
                'Escovar os dentes',
                'Comer uma refeição saudável',
                'Lavar a louça',
                'Beber 2L de Água',
                'Organizar a casa (10 min)'
            ];
            
            // Reseta apenas as missões diárias pré-definidas
            this.missions.forEach(mission => {
                if (dailyMissionNames.includes(mission.name)) {
                    mission.completed = false;
                    mission.completedAt = null;
                    if (mission.type === 'counter') {
                        mission.progress = 0;
                    }
                    if (mission.type === 'timer') {
                        mission.timeElapsed = 0;
                        mission.isRunning = false;
                        if (mission.startTime) {
                            delete mission.startTime;
                        }
                    }
                }
            });
            
            localStorage.setItem('lastBoardMissionReset', today);
            this.saveMissions();
            
            // Se não houver missões, adiciona as pré-definidas
            if (this.missions.length === 0) {
                this.addExampleMissions();
            }
        }
    }

    loadEnergy() {
        const saved = localStorage.getItem('energyTotal');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveEnergy() {
        localStorage.setItem('energyTotal', this.energyTotal.toString());
    }

    loadCrystals() {
        const saved = localStorage.getItem('focusCrystals');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveCrystals() {
        localStorage.setItem('focusCrystals', this.focusCrystals.toString());
    }

    getNextId() {
        const saved = localStorage.getItem('nextMissionId');
        const id = saved ? parseInt(saved, 10) : 1;
        localStorage.setItem('nextMissionId', (id + 1).toString());
        return id;
    }

    addExampleMissions() {
        const examples = [
            // Missões de Checklist (Simples) - Verde para Saúde
            {
                id: this.getNextId(),
                name: 'Escovar os dentes',
                category: 'Saúde',
                type: 'checklist',
                reward: 5,
                completed: false,
                icon: '🦷',
                color: 'green'
            },
            {
                id: this.getNextId(),
                name: 'Comer uma refeição saudável',
                category: 'Saúde',
                type: 'checklist',
                reward: 5,
                completed: false,
                icon: '🥗',
                color: 'green'
            },
            {
                id: this.getNextId(),
                name: 'Lavar a louça',
                category: 'Limpeza',
                type: 'checklist',
                reward: 5,
                completed: false,
                icon: '🧽',
                color: 'orange'
            },
            // Missão de Contador (Progressiva) - Azul para Hidratação
            {
                id: this.getNextId(),
                name: 'Beber 2L de Água',
                category: 'Saúde',
                type: 'counter',
                reward: 2,
                target: 2000,
                progress: 0,
                completed: false,
                icon: '💧',
                color: 'blue'
            },
            // Missão de Tempo (Timer) - Laranja para Limpeza
            {
                id: this.getNextId(),
                name: 'Organizar a casa (10 min)',
                category: 'Limpeza',
                type: 'timer',
                reward: 15,
                crystalReward: 1,
                duration: 600,
                timeElapsed: 0,
                isRunning: false,
                completed: false,
                icon: '🏠',
                color: 'orange'
            }
        ];
        
        this.missions = examples;
        this.saveMissions();
        this.renderMissions();
    }

    addMission(name, category, reward) {
        const mission = {
            id: this.nextId++,
            name: name,
            category: category,
            reward: parseInt(reward, 10),
            type: 'checklist',
            completed: false,
            icon: this.getCategoryIcon(category),
            color: this.getCategoryColor(category)
        };
        
        this.missions.push(mission);
        this.saveMissions();
        this.renderMissions();
        this.updateEmptyState();
    }

    completeMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.completed) return;

        if (mission.type === 'timer' || mission.type === 'counter') {
            return;
        }

        if (mission.type === 'checklist' || !mission.type) {
            mission.completed = true;
            mission.completedAt = new Date().toISOString();
            this.saveMissions();
            
            this.energyTotal += mission.reward || 5;
            this.saveEnergy();
            
            // Celebração com confetes
            celebrarConclusao(mission);
            
            this.updateCounters();
            this.renderMissions();
            
            // Salva no Supabase
            completarMissao(missionId, mission, 'board');
        }
    }

    addWaterProgress(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'counter' || mission.completed) return;

        mission.progress = (mission.progress || 0) + 250;
        this.saveMissions();
        
        this.energyTotal += mission.reward || 2;
        this.saveEnergy();
        
        if (mission.progress >= mission.target) {
            mission.completed = true;
            mission.completedAt = new Date().toISOString();
            
            // Celebração com confetes
            celebrarConclusao(mission);
            
            // Salva no Supabase quando completa
            completarMissao(missionId, mission, 'board');
        }
        
        this.updateCounters();
        this.renderMissions();
    }

    startTimer(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'timer' || mission.completed || mission.isRunning) return;

        const alreadyElapsed = mission.timeElapsed || 0;
        mission.isRunning = true;
        mission.startTime = Date.now() - (alreadyElapsed * 1000);
        this.saveMissions();
        this.renderMissions();

        const timerInterval = setInterval(() => {
            const mission = this.missions.find(m => m.id === missionId);
            if (!mission || !mission.isRunning) {
                clearInterval(timerInterval);
                return;
            }

            const elapsed = Math.floor((Date.now() - mission.startTime) / 1000);
            mission.timeElapsed = elapsed;
            
            if (elapsed >= mission.duration) {
                mission.completed = true;
                mission.isRunning = false;
                mission.completedAt = new Date().toISOString();
                mission.timeElapsed = mission.duration;
                this.saveMissions();
                
                this.energyTotal += mission.reward || 15;
                this.focusCrystals += mission.crystalReward || 1;
                this.saveEnergy();
                this.saveCrystals();
                
                // Celebração com confetes (dourados se tiver crystalReward)
                celebrarConclusao(mission);
                
                // Salva no Supabase quando completa
                completarMissao(missionId, mission, 'board');
                
                clearInterval(timerInterval);
                this.updateCounters();
            }
            
            this.renderMissions();
        }, 1000);
    }

    stopTimer(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || mission.type !== 'timer' || !mission.isRunning) return;

        if (mission.startTime) {
            const elapsed = Math.floor((Date.now() - mission.startTime) / 1000);
            mission.timeElapsed = (mission.timeElapsed || 0) + elapsed;
        }
        
        mission.isRunning = false;
        delete mission.startTime;
        this.saveMissions();
        this.renderMissions();
    }

    undoMission(missionId) {
        const mission = this.missions.find(m => m.id === missionId);
        if (!mission || !mission.completed) return;

        if (mission.type === 'timer' && mission.isRunning) {
            this.stopTimer(missionId);
        }

        mission.completed = false;
        delete mission.completedAt;
        
        if (mission.type === 'timer') {
            this.energyTotal -= mission.reward || 15;
            this.focusCrystals -= mission.crystalReward || 1;
            mission.timeElapsed = 0;
            mission.isRunning = false;
        } else if (mission.type === 'counter') {
            const increments = Math.floor((mission.progress || 0) / 250);
            this.energyTotal -= increments * (mission.reward || 2);
            mission.progress = 0;
        } else {
            this.energyTotal -= mission.reward || 5;
        }
        
        if (this.focusCrystals < 0) this.focusCrystals = 0;
        if (this.energyTotal < 0) this.energyTotal = 0;
        
        this.saveMissions();
        this.saveCrystals();
        this.saveEnergy();
        
        this.updateCounters();
        this.renderMissions();
    }

    updateCounters() {
        const energyEl = document.getElementById('energyTotal');
        const crystalsEl = document.getElementById('focusCrystals');
        const energyDisplay = document.getElementById('energyDisplay');
        const focusDisplay = document.getElementById('focusDisplay');
        
        if (energyEl) {
            this.animateCounter(energyEl, this.energyTotal, 'energy');
        }
        if (crystalsEl) {
            this.animateCounter(crystalsEl, this.focusCrystals, 'crystals');
        }
        // Atualiza displays no header
        if (energyDisplay) {
            energyDisplay.textContent = this.energyTotal.toLocaleString('pt-BR');
        }
        if (focusDisplay) {
            focusDisplay.textContent = this.focusCrystals.toLocaleString('pt-BR');
        }
    }

    animateCounter(element, targetValue, type) {
        if (type === 'energy' && this.energyTimer) {
            clearInterval(this.energyTimer);
            this.energyTimer = null;
        }
        if (type === 'crystals' && this.crystalsTimer) {
            clearInterval(this.crystalsTimer);
            this.crystalsTimer = null;
        }

        const currentValue = parseInt(element.textContent) || 0;
        
        if (currentValue === targetValue) {
            element.textContent = targetValue;
            return;
        }

        const increment = targetValue > currentValue ? 1 : -1;
        const duration = 300;
        const steps = Math.abs(targetValue - currentValue);
        
        if (steps === 0) {
            element.textContent = targetValue;
            return;
        }
        
        const stepDuration = Math.max(10, duration / steps);

        let current = currentValue;
        const timer = setInterval(() => {
            current += increment;
            
            if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
                current = targetValue;
                element.textContent = current;
                clearInterval(timer);
                
                if (type === 'energy') {
                    this.energyTimer = null;
                } else if (type === 'crystals') {
                    this.crystalsTimer = null;
                }
            } else {
                element.textContent = current;
            }
            
            if (current === currentValue || current === targetValue) {
                element.classList.add('scale-110');
                setTimeout(() => {
                    element.classList.remove('scale-110');
                }, 100);
            }
        }, stepDuration);
        
        if (type === 'energy') {
            this.energyTimer = timer;
        } else if (type === 'crystals') {
            this.crystalsTimer = timer;
        }
    }

    getCategoryIcon(category) {
        const icons = {
            'Estudo': '📚',
            'Trabalho': '💼',
            'Saúde': '💪',
            'Criatividade': '🎨',
            'Social': '👥',
            'Limpeza': '🧹',
            'Outros': '🔖'
        };
        return icons[category] || '🔖';
    }

    getCategoryColor(category) {
        const colors = {
            'Saúde': 'green',
            'Limpeza': 'orange',
            'Estudo': 'purple',
            'Trabalho': 'blue',
            'Criatividade': 'pink',
            'Social': 'yellow',
            'Outros': 'gray'
        };
        return colors[category] || 'green';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    renderMissions() {
        const grid = document.getElementById('missionsGrid');
        if (!grid) return;

        // Otimização: Usa requestAnimationFrame para evitar bloqueio da UI
        if (this._renderTimeout) {
            clearTimeout(this._renderTimeout);
        }
        
        this._renderTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                grid.innerHTML = '';

                const activeMissions = this.missions.filter(m => !m.completed);
                const completedMissions = this.missions.filter(m => m.completed);

                // Limita renderização a 50 missões por vez para performance
                const maxMissions = 50;
                const activeToRender = activeMissions.slice(0, maxMissions);
                const completedToRender = completedMissions.slice(0, maxMissions - activeToRender.length);

                activeToRender.forEach(mission => {
                    grid.appendChild(this.createMissionCard(mission));
                });

                completedToRender.forEach(mission => {
                    grid.appendChild(this.createMissionCard(mission, true));
                });

                this.updateEmptyState();
            });
        }, 10); // Debounce de 10ms
    }

    createMissionCard(mission, isCompleted = false) {
        const card = document.createElement('div');
        const colorClass = mission.color || 'green';
        card.className = `board-mission-card mission-color-${colorClass} ${isCompleted ? 'completed' : ''}`;
        card.setAttribute('data-mission-id', mission.id);

        if (mission.type === 'checklist') {
            card.innerHTML = this.renderChecklistCard(mission, isCompleted);
        } else if (mission.type === 'counter') {
            card.innerHTML = this.renderCounterCard(mission, isCompleted);
        } else if (mission.type === 'timer') {
            card.innerHTML = this.renderTimerCard(mission, isCompleted);
        } else {
            // Missão padrão (fallback)
            card.innerHTML = this.renderDefaultCard(mission, isCompleted);
        }

        return card;
    }

    renderChecklistCard(mission, isCompleted) {
        const icon = mission.icon || '✓';
        if (isCompleted) {
            return `
                <div class="board-mission-header">
                    <div class="board-mission-title">
                        <span class="board-mission-icon">${icon}</span>
                        <h3 class="board-mission-name completed">${mission.name}</h3>
                    </div>
                    <span class="board-mission-status">✓ Concluída</span>
                </div>
                
                <div class="board-mission-category">
                    ${this.getCategoryIcon(mission.category)} ${mission.category}
                </div>
                
                <div class="board-mission-actions">
                    <div class="board-mission-rewards">
                        <div class="reward-item energy">
                            <span>⚡</span>
                            <span>+${mission.reward}</span>
                            <span class="text-secondary">energia</span>
                        </div>
                    </div>
                    
                    <button 
                        onclick="missionsBoard.undoMission(${mission.id})"
                        class="btn btn-secondary"
                    >
                        ↶ Desfazer
                    </button>
                </div>
            `;
        }
        return `
            <div class="board-mission-header">
                <div class="board-mission-title">
                    <span class="board-mission-icon">${icon}</span>
                    <h3 class="board-mission-name">${mission.name}</h3>
                </div>
            </div>
            
            <div class="board-mission-category">
                ${this.getCategoryIcon(mission.category)} ${mission.category}
            </div>
            
            <div class="board-mission-actions">
                <div class="board-mission-rewards">
                    <div class="reward-item energy">
                        <span>⚡</span>
                        <span>+${mission.reward}</span>
                        <span class="text-secondary">energia</span>
                    </div>
                </div>
                
                <button 
                    onclick="missionsBoard.completeMission(${mission.id})"
                    class="btn btn-success"
                >
                    ✓ Concluir
                </button>
            </div>
        `;
    }

    renderCounterCard(mission, isCompleted) {
        const progress = mission.progress || 0;
        const target = mission.target || 2000;
        const percentage = Math.min((progress / target) * 100, 100);
        const icon = mission.icon || '💧';
        
        if (isCompleted) {
            return `
                <div class="board-mission-header">
                    <div class="board-mission-title">
                        <span class="board-mission-icon">${icon}</span>
                        <h3 class="board-mission-name completed">${mission.name}</h3>
                    </div>
                    <span class="board-mission-status">✓ Concluída</span>
                </div>
                
                <div class="board-mission-progress">
                    <div class="progress-info">
                        <span>${(progress/1000).toFixed(1)}L / ${(target/1000).toFixed(1)}L</span>
                        <span>100%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill blue" style="width: 100%"></div>
                    </div>
                </div>
                
                <div class="board-mission-actions">
                    <div class="board-mission-rewards">
                        <div class="reward-item energy">
                            <span>⚡</span>
                            <span>+${Math.floor(progress/250) * mission.reward}</span>
                            <span class="text-secondary">energia</span>
                        </div>
                    </div>
                    
                    <button 
                        onclick="missionsBoard.undoMission(${mission.id})"
                        class="btn btn-secondary"
                    >
                        ↶ Desfazer
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="board-mission-header">
                <div class="board-mission-title">
                    <span class="board-mission-icon">${icon}</span>
                    <h3 class="board-mission-name">${mission.name}</h3>
                </div>
            </div>
            
            <div class="board-mission-progress">
                <div class="progress-info">
                    <span>${(progress/1000).toFixed(1)}L / ${(target/1000).toFixed(1)}L</span>
                    <span>${Math.round(percentage)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill blue" style="width: ${percentage}%"></div>
                </div>
                <button 
                    onclick="missionsBoard.addWaterProgress(${mission.id})"
                    class="btn btn-primary"
                    style="width: 100%; margin-top: 8px;"
                >
                    + 250ml (+${mission.reward} ⚡)
                </button>
            </div>
            
            <div class="board-mission-actions">
                <div class="board-mission-rewards">
                    <div class="reward-item energy">
                        <span>⚡</span>
                        <span>+${mission.reward}</span>
                        <span class="text-secondary">por 250ml</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderTimerCard(mission, isCompleted) {
        const icon = mission.icon || '⏱️';
        const timeElapsed = mission.timeElapsed || 0;
        const duration = mission.duration || 600;
        const remaining = Math.max(0, duration - timeElapsed);
        const percentage = (timeElapsed / duration) * 100;
        
        if (isCompleted) {
            return `
                <div class="board-mission-header">
                    <div class="board-mission-title">
                        <span class="board-mission-icon">${icon}</span>
                        <h3 class="board-mission-name completed">${mission.name}</h3>
                    </div>
                    <span class="board-mission-status">✓ Concluída</span>
                </div>
                
                <div class="board-mission-progress">
                    <div class="progress-info">
                        <span>Tempo: ${this.formatTime(duration)}</span>
                        <span>Completo!</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill green" style="width: 100%"></div>
                    </div>
                </div>
                
                <div class="board-mission-actions">
                    <div class="board-mission-rewards">
                        <div class="reward-item energy">
                            <span>⚡</span>
                            <span>+${mission.reward}</span>
                            <span class="text-secondary">energia</span>
                        </div>
                        <div class="reward-item crystal">
                            <span>💎</span>
                            <span>+${mission.crystalReward || 1}</span>
                            <span class="text-secondary">cristal</span>
                        </div>
                    </div>
                    
                    <button 
                        onclick="missionsBoard.undoMission(${mission.id})"
                        class="btn btn-secondary"
                    >
                        ↶ Desfazer
                    </button>
                </div>
            `;
        }
        
        const isRunning = mission.isRunning || false;
        
        return `
            <div class="board-mission-header">
                <div class="board-mission-title">
                    <span class="board-mission-icon">${icon}</span>
                    <h3 class="board-mission-name">${mission.name}</h3>
                </div>
            </div>
            
            <div class="board-mission-progress">
                <div class="progress-info">
                    <span>Tempo restante: ${this.formatTime(remaining)}</span>
                    <span>${Math.round(percentage)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill orange" style="width: ${percentage}%"></div>
                </div>
                ${!isRunning ? `
                    <button 
                        onclick="missionsBoard.startTimer(${mission.id})"
                        class="btn btn-primary"
                        style="width: 100%; margin-top: 8px;"
                    >
                        ▶ Iniciar Timer
                    </button>
                ` : `
                    <button 
                        onclick="missionsBoard.stopTimer(${mission.id})"
                        class="btn btn-danger"
                        style="width: 100%; margin-top: 8px; background: var(--danger-color);"
                    >
                        ⏸ Pausar Timer
                    </button>
                `}
            </div>
            
            <div class="board-mission-actions">
                <div class="board-mission-rewards">
                    <div class="reward-item energy">
                        <span>⚡</span>
                        <span>+${mission.reward}</span>
                        <span class="text-secondary">energia</span>
                    </div>
                    <div class="reward-item crystal">
                        <span>💎</span>
                        <span>+${mission.crystalReward || 1}</span>
                        <span class="text-secondary">cristal</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderDefaultCard(mission, isCompleted) {
        // Código padrão (fallback para missões sem tipo definido)
        if (isCompleted) {
            return `
                <div class="board-mission-header">
                    <h3 class="board-mission-name completed">${mission.name}</h3>
                    <span class="board-mission-status">✓ Concluída</span>
                </div>
                
                <div class="board-mission-category">
                    ${this.getCategoryIcon(mission.category)} ${mission.category}
                </div>
                
                <div class="board-mission-actions">
                    <div class="board-mission-rewards">
                        <div class="reward-item crystal">
                            <span>💎</span>
                            <span>${mission.reward}</span>
                            <span class="text-secondary">cristais</span>
                        </div>
                    </div>
                    
                    <button 
                        onclick="missionsBoard.undoMission(${mission.id})"
                        class="btn btn-secondary"
                    >
                        ↶ Desfazer
                    </button>
                </div>
            `;
        }
        return `
            <div class="board-mission-header">
                <h3 class="board-mission-name">${mission.name}</h3>
            </div>
            
            <div class="board-mission-category">
                ${this.getCategoryIcon(mission.category)} ${mission.category}
            </div>
            
            <div class="board-mission-actions">
                <div class="board-mission-rewards">
                    <div class="reward-item crystal">
                        <span>💎</span>
                        <span>${mission.reward}</span>
                        <span class="text-secondary">cristais</span>
                    </div>
                </div>
                
                <button 
                    onclick="missionsBoard.completeMission(${mission.id})"
                    class="btn btn-primary"
                >
                    ✓ Concluir
                </button>
            </div>
        `;
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const grid = document.getElementById('missionsGrid');
        
        if (this.missions.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (grid) grid.style.display = 'none';
        } else {
            if (emptyState) emptyState.classList.add('hidden');
            if (grid) grid.style.display = 'grid';
        }
    }

    setupEventListeners() {
        const form = document.getElementById('missionForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddMission();
            });
        }

        const modal = document.getElementById('addMissionModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeAddMissionModal();
                }
            });
        }
    }

    handleAddMission() {
        const name = document.getElementById('missionName').value.trim();
        const category = document.getElementById('missionCategory').value;
        const reward = document.getElementById('missionReward').value;

        if (name && category && reward) {
            this.addMission(name, category, reward);
            closeAddMissionModal();
            
            document.getElementById('missionForm').reset();
            document.getElementById('missionReward').value = '10';
        }
    }
}

// Funções globais para o modal
function openAddMissionModal() {
    const modal = document.getElementById('addMissionModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeAddMissionModal() {
    const modal = document.getElementById('addMissionModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Expõe funções globalmente para uso no HTML
window.openAddMissionModal = openAddMissionModal;
window.closeAddMissionModal = closeAddMissionModal;

// ============================================
// FUNÇÕES DE INTEGRAÇÃO COM SUPABASE
// ============================================

/**
 * Completa uma missão e salva no Supabase
 * @param {number} missionId - ID da missão
 * @param {object} mission - Objeto da missão completo
 * @param {string} source - Origem da missão ('daily' ou 'board')
 */
/**
 * Salva uma atividade no banco de dados Supabase (tabela: atividades)
 * @param {string} taskName - Nome da tarefa/atividade
 * @param {number} score - Pontuação/score da atividade
 * @returns {Promise<Object|null>} Retorna os dados salvos ou null em caso de erro
 */
async function saveActivity(taskName, score) {
    if (!supabaseClient) {
        console.warn('%c⚠️ Supabase não configurado. Atividade não foi salva.', 'color: #f59e0b; font-weight: bold;');
        return null;
    }

    if (!taskName || score === undefined || score === null) {
        console.error('%c❌ Erro: taskName e score são obrigatórios', 'color: #ef4444; font-weight: bold;');
        return null;
    }

    // Verifica autenticação antes de salvar
    const userId = window.currentUser?.id || await getCurrentUserIdAsync();
    if (!userId) {
        console.warn('Usuário não autenticado, não será possível salvar atividade no Supabase');
        return null;
    }

    try {
        const atividade = {
            user_id: userId,
            nome_tarefa: taskName,
            pontuacao: score,
            data_completada: new Date().toISOString(),
            regiao: 'sa-east-1' // Região de São Paulo
        };

        console.log('%c📤 Enviando atividade para o banco de dados...', 'color: #6366f1; font-weight: bold;');
        console.log('📋 Dados:', {
            tarefa: taskName,
            pontuacao: score,
            regiao: 'sa-east-1 (São Paulo)',
            timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        });

        const { data, error } = await supabaseClient
            .from('atividades')
            .insert([atividade])
            .select();

        if (error) {
            console.error('%c❌ Erro ao salvar atividade no Supabase:', 'color: #ef4444; font-weight: bold;', error);
            console.error('📝 Detalhes do erro:', {
                mensagem: error.message,
                codigo: error.code,
                detalhes: error.details,
                hint: error.hint
            });
            return null;
        }

        if (data && data.length > 0) {
            const registroSalvo = data[0];
            console.log('%c✅ Registro salvo com sucesso no banco de dados de São Paulo!', 'color: #10b981; font-weight: bold;');
            console.log('%c📊 Detalhes do registro:', 'color: #10b981; font-weight: bold;', {
                id: registroSalvo.id,
                tarefa: registroSalvo.nome_tarefa,
                pontuacao: registroSalvo.pontuacao,
                data: new Date(registroSalvo.data_completada).toLocaleString('pt-BR', { 
                    timeZone: 'America/Sao_Paulo',
                    dateStyle: 'full',
                    timeStyle: 'medium'
                }),
                regiao: registroSalvo.regiao || 'sa-east-1'
            });
            console.log('%c🌐 Região: sa-east-1 (São Paulo, Brasil)', 'color: #6366f1; font-weight: bold;');
            return registroSalvo;
        } else {
            console.warn('%c⚠️ Nenhum dado retornado do Supabase', 'color: #f59e0b; font-weight: bold;');
            return null;
        }
    } catch (error) {
        console.error('%c❌ Erro inesperado ao salvar atividade:', 'color: #ef4444; font-weight: bold;', error);
        console.error('📝 Stack trace:', error.stack);
        return null;
    }
}

/**
 * Completa uma missão e salva no Supabase (função legada - mantida para compatibilidade)
 * @param {number} missionId - ID da missão
 * @param {object} mission - Objeto da missão completo
 * @param {string} source - Origem da missão ('daily' ou 'board')
 */
async function completarMissao(missionId, mission, source = 'daily') {
    if (!supabaseClient) {
        console.warn('%c⚠️ Supabase não configurado. Missão completada apenas localmente.', 'color: #f59e0b; font-weight: bold;');
        return;
    }

    // Verifica autenticação antes de salvar
    const userId = window.currentUser?.id || await getCurrentUserIdAsync();
    if (!userId) {
        console.warn('Usuário não autenticado, não será possível salvar missão no Supabase');
        return;
    }

    try {
        const atividade = {
            user_id: userId,
            missao_id: missionId,
            nome_missao: mission.title || mission.name,
            tipo_missao: mission.type || 'checklist',
            categoria: mission.category || 'Outros',
            recompensa: mission.reward || 0,
            origem: source, // 'daily' ou 'board'
            data_completada: new Date().toISOString(),
            progresso: mission.progress || null,
            tempo_decorrido: mission.timeElapsed || null
        };

        const { data, error } = await supabaseClient
            .from('historico_atividades')
            .insert([atividade])
            .select();

        if (error) {
            console.error('%c❌ Erro ao salvar no Supabase:', 'color: #ef4444; font-weight: bold;', error);
        } else {
            console.log('%c✅ Missão salva no Supabase com sucesso!', 'color: #10b981; font-weight: bold;', data);
        }
    } catch (error) {
        console.error('%c❌ Erro ao completar missão no Supabase:', 'color: #ef4444; font-weight: bold;', error);
    }
}

/**
 * Carrega o progresso mensal dos últimos 30 dias
 * @returns {Promise<Array>} Array com os logs de atividades dos últimos 30 dias
 */
async function carregarProgressoMensal() {
    if (!supabaseClient) {
        console.warn('Supabase não configurado. Não é possível carregar progresso.');
        return [];
    }

    try {
        // Calcula a data de 30 dias atrás
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - 30);
        const dataInicioISO = dataInicio.toISOString();

        // Verifica autenticação antes de buscar
        const userId = window.currentUser?.id || await getCurrentUserIdAsync();
        if (!userId) {
            console.warn('Usuário não autenticado, não será possível carregar progresso do Supabase');
            return [];
        }
        
        // Busca todas as atividades dos últimos 30 dias do usuário atual
        const { data, error } = await supabaseClient
            .from('historico_atividades')
            .select('*')
            .eq('user_id', userId)
            .gte('data_completada', dataInicioISO)
            .order('data_completada', { ascending: true });

        if (error) {
            console.error('Erro ao carregar progresso do Supabase:', error);
            // Tenta usar cache offline em caso de erro
            const dadosCacheados = await obterMissoesCacheadas();
            if (dadosCacheados) {
                console.log('%c📦 Usando dados do cache offline', 'color: #6366f1; font-weight: bold;');
                return dadosCacheados;
            }
            return [];
        }

        const dados = data || [];
        console.log(`%c✅ Carregados ${dados.length} registros dos últimos 30 dias`, 'color: #10b981; font-weight: bold;');
        
        // Cacheia os dados para uso offline
        if (dados.length > 0) {
            cachearMissoesParaOffline(dados);
        }
        
        return dados;
    } catch (error) {
        console.error('Erro ao carregar progresso mensal:', error);
        return [];
    }
}

// Torna as funções acessíveis globalmente
window.completarMissao = completarMissao;
window.carregarProgressoMensal = carregarProgressoMensal;
window.saveActivity = saveActivity;

// ============================================
// REGISTRO DO SERVICE WORKER (PWA)
// ============================================

// Service Worker desabilitado - arquivo não existe
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/service-worker.js')
//             .then((registration) => {
//                 console.log('%c✅ Service Worker registrado com sucesso!', 'color: #10b981; font-weight: bold;');
//                 console.log('📱 PWA instalável:', registration.scope);
//                 
//                 // Verifica se há atualizações
//                 registration.addEventListener('updatefound', () => {
//                     const newWorker = registration.installing;
//                     newWorker.addEventListener('statechange', () => {
//                         if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
//                             console.log('%c🔄 Nova versão disponível!', 'color: #f59e0b; font-weight: bold;');
//                             // Pode mostrar notificação para o usuário atualizar
//                         }
//                     });
//                 });
//             })
//             .catch((error) => {
//                 console.warn('%c⚠️ Erro ao registrar Service Worker:', 'color: #f59e0b; font-weight: bold;', error);
//             });
//         
//         // Escuta mensagens do service worker
//         navigator.serviceWorker.addEventListener('message', (event) => {
//             if (event.data && event.data.type === 'SW_READY') {
//                 console.log('%c✅ Service Worker pronto!', 'color: #10b981; font-weight: bold;');
//             }
//         });
//     });
// }

// Função para cachear missões para uso offline
function cachearMissoesParaOffline(missionsData) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        navigator.serviceWorker.controller.postMessage(
            {
                type: 'CACHE_MISSIONS',
                data: missionsData
            },
            [messageChannel.port2]
        );
    }
}

// Função para obter missões cacheadas (offline)
function obterMissoesCacheadas() {
    return new Promise((resolve) => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                if (event.data.success) {
                    resolve(event.data.data);
                } else {
                    resolve(null);
                }
            };
            navigator.serviceWorker.controller.postMessage(
                { type: 'GET_CACHED_MISSIONS' },
                [messageChannel.port2]
            );
        } else {
            resolve(null);
        }
    });
}

// Torna funções acessíveis globalmente
window.cachearMissoesParaOffline = cachearMissoesParaOffline;
window.obterMissoesCacheadas = obterMissoesCacheadas;

// ============================================
// SISTEMA DE AÇÕES INSTANTÂNEAS
// ============================================

// Widget de Água
let waterAmount = 0;
const waterTarget = 2000; // 2L
let waterAlertInterval = 120; // 2 horas em minutos (padrão)
let lastWaterTime = null;
// waterAlertCheckInterval já declarado acima na seção de Escudos
let focusTimerInterval = null;
let focusTimerRemaining = 600; // 10 minutos em segundos
let focusTimerIsRunning = false;
let focusTimerStartTime = null;

/**
 * Adiciona 250ml de água e atualiza o widget
 */
async function addWaterInstant() {
    const waterAmountAnterior = waterAmount;
    waterAmount = waterAmount + 250; // Permite passar de 100% para continuar preenchendo
    
    // Atualiza a UI
    updateWaterWidget();
    
    // Verifica se atingiu ou passou de 100% pela primeira vez
    const percentage = Math.round((waterAmount / waterTarget) * 100);
    const percentageAnterior = Math.round((waterAmountAnterior / waterTarget) * 100);
    
    if (percentage >= 100 && percentageAnterior < 100) {
        // Atingiu 100% pela primeira vez
        // Dispara confetti
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#fbbf24', '#fcd34d', '#fde047', '#fef08a', '#fef3c7']
            });
        }
        
        // Exibe mensagem
        const waterWidget = document.getElementById('waterWidget');
        if (waterWidget) {
            // Cria ou atualiza mensagem de sucesso
            let successMsg = document.getElementById('waterSuccessMessage');
            if (!successMsg) {
                successMsg = document.createElement('div');
                successMsg.id = 'waterSuccessMessage';
                successMsg.className = 'text-center mt-2 text-yellow-400 font-semibold text-sm';
                waterWidget.appendChild(successMsg);
            }
            successMsg.textContent = '✨ Sistema Hidratado. Estabilidade Máxima Alcançada!';
            successMsg.classList.remove('hidden');
            
            // Remove mensagem após 5 segundos
            setTimeout(() => {
                if (successMsg) {
                    successMsg.classList.add('hidden');
                }
            }, 5000);
        }
    }
    
    // Animação de onda
    const wave = document.getElementById('waterWave');
    if (wave) {
        wave.classList.remove('active');
        // Força reflow
        void wave.offsetWidth;
        wave.classList.add('active');
    }
    
    // Som de água (opcional)
    // playWaterSound();
    
    // Salva no Supabase com objeto específico
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível salvar água no Supabase');
                return;
            }
            
            // Cria objeto com campos corretos da tabela atividades
            const waterLog = {
                user_id: userId,
                nome_tarefa: 'Beber Água',
                pontuacao: 5, // Pontuação por copo de água
                categoria: 'Saúde',
                regiao: 'sa-east-1',
                data_completada: new Date().toISOString(),
                dados_extras: {
                    activity: 'water_intake',
                    amount: 250,
                    unit: 'ml',
                    timestamp: new Date().toISOString()
                }
            };
            
            // Envia para a tabela atividades
            const { data: insertData, error: insertError } = await supabaseClient
                .from('atividades')
                .insert([waterLog])
                .select();
            
            if (insertError) {
                console.error('❌ Erro ao inserir registro de água:', insertError);
                console.error('📋 Dados que tentaram ser inseridos:', waterLog);
                throw insertError;
            }
            
            if (insertData && insertData.length > 0) {
                console.log('%c✅ Registro de água inserido com sucesso:', 'color: #10b981; font-weight: bold;', insertData[0]);
                console.log('%c📊 Objeto enviado:', 'color: #3b82f6; font-weight: bold;', waterLog);
            } else {
                console.warn('⚠️ Nenhum dado retornado após inserção (mas sem erro)');
            }
        } catch (error) {
            console.error('Erro ao salvar água no Supabase:', error);
            console.error('Detalhes:', error.message);
        }
    }
    
    // Salva no localStorage
    localStorage.setItem('waterAmount', waterAmount.toString());
    
    // Atualiza o tempo do último clique
    lastWaterTime = Date.now();
    localStorage.setItem('lastWaterTime', lastWaterTime.toString());
    
    // Remove alerta se estava ativo
    const waterWidget = document.getElementById('waterWidget');
    if (waterWidget) {
        waterWidget.classList.remove('alert');
    }
    
    // Vibração suave
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

/**
 * Atualiza o widget de água
 */
function updateWaterWidget() {
    // Garante que waterAmount não seja negativo ou undefined
    if (!waterAmount || waterAmount < 0) {
        waterAmount = 0;
    }
    
    const percentage = Math.round((waterAmount / waterTarget) * 100);
    const percentageEl = document.getElementById('waterPercentage');
    const amountEl = document.getElementById('waterAmount');
    const circleEl = document.getElementById('waterProgressCircle');
    
    // Atualiza barra de Mana
    atualizarBarrasStatusRPG();
    
    if (percentageEl) {
        percentageEl.textContent = `${percentage}%`;
    }
    
    if (amountEl) {
        amountEl.textContent = `${waterAmount}ml / ${waterTarget}ml`;
    }
    
    // Atualiza estado visual do widget compacto
    atualizarEstadoWidgets();
    
    if (circleEl) {
        // CORREÇÃO: O raio no HTML é 28, não 35!
        const radius = 28;
        const circumference = 2 * Math.PI * radius; // ≈ 175.9
        
        // Se passou de 100%, calcula o progresso extra (começa a preencher novamente)
        let displayPercentage = percentage;
        if (percentage > 100) {
            // Calcula quantas vezes passou de 100% e o resto
            displayPercentage = percentage % 100;
            // Se for exatamente múltiplo de 100, mostra 100%
            if (displayPercentage === 0) {
                displayPercentage = 100;
            }
        }
        
        // Calcula o offset: quando offset = 0, o círculo está 100% preenchido
        // Quando offset = circumference, o círculo está 0% preenchido
        const offset = circumference - (displayPercentage / 100) * circumference;
        
        // Aplica transição suave e atualiza o offset
        circleEl.style.transition = 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease-out';
        circleEl.style.strokeDashoffset = offset;
        
        // Muda cor para dourado se atingiu ou passou de 100%
        if (percentage >= 100) {
            circleEl.style.stroke = '#fbbf24'; // Dourado brilhante
        } else {
            circleEl.style.stroke = '#3b82f6'; // Azul padrão
        }
        
        // Log para debug
        console.log(`💧 Atualizando barra: ${waterAmount}ml (${percentage}%) - offset: ${offset.toFixed(2)}`);
    }
    
    // Atualiza também a barra linear se existir
    atualizarVisualAgua(percentage);
}

/**
 * Atualiza a barra linear de água (se existir no HTML)
 * @param {number} porcentagem - Porcentagem de 0 a 100+
 */
function atualizarBarraVisual(porcentagem) {
    const barra = document.getElementById('barra-azul-fill'); // Certifique-se de que o ID é este
    if (barra) {
        // Forçamos o estilo direto no elemento para o navegador ignorar o Purge do Tailwind
        barra.style.width = `${Math.min(porcentagem, 100)}%`;
        
        // Troca de cor: Azul para Dourado
        if (porcentagem >= 100) {
            barra.style.backgroundColor = '#fbbf24'; // Dourado
            barra.style.boxShadow = '0 0 15px #fbbf24';
        } else {
            barra.style.backgroundColor = '#3b82f6'; // Azul
            barra.style.boxShadow = '0 0 10px #3b82f6';
        }
    }
}

// Mantém compatibilidade com nome antigo
function atualizarVisualAgua(porcentagem) {
    atualizarBarraVisual(porcentagem);
}

/**
 * Busca progresso de água de hoje no Supabase
 * Tenta primeiro em 'atividades', depois em 'historico_atividades' como fallback
 */
async function buscarProgressoAguaHoje() {
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        return 0;
    }
    
    try {
        // Busca atividades de água de hoje usando filtro de data
        // Usa apenas a data (sem hora) para pegar tudo a partir das 00:00 de hoje
        const hojeDataString = getLocalDateString(); // Formato: YYYY-MM-DD (horário local)
        
        // Tenta primeiro na tabela 'atividades'
        // Seleciona todos os campos necessários para evitar erro 400
        const { data, error } = await client
            .from('atividades')
            .select('dados_extras, categoria, nome_tarefa, data_completada')
            .eq('user_id', window.currentUser.id)
            .eq('categoria', 'Saúde')
            .eq('nome_tarefa', 'Beber Água')
            .gte('data_completada', hojeDataString)
            .order('data_completada', { ascending: false });
        
        let totalHoje = 0;
        
        // Se não houver erro e houver dados, soma
        if (!error && data && data.length > 0) {
            console.log(`📊 Encontrados ${data.length} registros de água de hoje`);
            
            data.forEach(registro => {
                // Verifica se os campos categoria e nome_tarefa estão corretos (validação extra)
                const categoriaOk = registro.categoria === 'Saúde';
                const nomeOk = registro.nome_tarefa === 'Beber Água';
                
                if (categoriaOk && nomeOk && registro.dados_extras) {
                    // Tenta acessar amount de diferentes formas (suporta JSONB)
                    const amount = registro.dados_extras.amount || 
                                  registro.dados_extras.quantidade;
                    if (amount && typeof amount === 'number') {
                        totalHoje += amount;
                        console.log(`💧 Adicionado ${amount}ml ao total (total: ${totalHoje}ml)`);
                    }
                } else {
                    console.warn('⚠️ Registro ignorado - campos não correspondem:', {
                        categoria: registro.categoria,
                        nome_tarefa: registro.nome_tarefa,
                        esperado: { categoria: 'Saúde', nome_tarefa: 'Beber Água' }
                    });
                }
            });
            
            // Se encontrou dados, retorna
            if (totalHoje > 0) {
                console.log(`✅ Total de água hoje: ${totalHoje}ml`);
                return totalHoje;
            }
        } else if (error) {
            console.warn('⚠️ Erro ao buscar progresso de água em atividades:', error);
            // Continua para o fallback
        } else {
            console.log('ℹ️ Nenhum registro de água encontrado em atividades para hoje');
        }
        
        // Fallback: busca em historico_atividades se atividades estiver vazia
        console.log('Tabela atividades vazia ou sem dados, buscando em historico_atividades...');
        
        const { data: historicoData, error: historicoError } = await client
            .from('historico_atividades')
            .select('progresso, nome_missao, categoria')
            .eq('user_id', window.currentUser.id)
            .gte('data_completada', hojeDataString)
            .order('data_completada', { ascending: false });
        
        if (!historicoError && historicoData && historicoData.length > 0) {
            historicoData.forEach(registro => {
                // Verifica se é uma missão de água
                const nomeMissao = registro.nome_missao?.toLowerCase() || '';
                const categoria = registro.categoria?.toLowerCase() || '';
                
                if ((nomeMissao.includes('água') || nomeMissao.includes('agua') || nomeMissao.includes('hidrata')) ||
                    (categoria === 'saúde' || categoria === 'saude')) {
                    
                    // Tenta extrair quantidade do progresso JSONB
                    if (registro.progresso) {
                        const progresso = registro.progresso;
                        const amount = progresso.amount || 
                                      progresso.quantidade || 
                                      progresso.waterAmount ||
                                      progresso.ml;
                        if (amount && typeof amount === 'number') {
                            totalHoje += amount;
                        }
                    }
                }
            });
        }
        
        return totalHoje;
    } catch (error) {
        console.error('Erro ao buscar progresso de água:', error);
        return 0;
    }
}

/**
 * Carrega a quantidade de água do Supabase (apenas de hoje) ou reseta se necessário
 */
async function loadWaterAmount() {
    // Inicializa com 0
    waterAmount = 0;
    
    // Busca progresso de água de hoje diretamente
    // A função buscarProgressoAguaHoje() já filtra por data de hoje usando .gte()
    const client = getSupabaseClient();
    if (client && window.currentUser?.id) {
        waterAmount = await buscarProgressoAguaHoje();
    }
    
    // Carrega configurações de alerta
    const savedInterval = localStorage.getItem('waterAlertInterval');
    if (savedInterval) {
        waterAlertInterval = parseInt(savedInterval, 10);
    }
    
    // Carrega último tempo de água
    const savedLastTime = localStorage.getItem('lastWaterTime');
    if (savedLastTime) {
        lastWaterTime = parseInt(savedLastTime, 10);
    }
    
    // Atualiza localStorage com o valor correto
    localStorage.setItem('waterAmount', waterAmount.toString());
    
    updateWaterWidget();
    
    // Inicia verificação de alerta
    startWaterAlertCheck();
}

/**
 * Abre o modal de configurações de água
 */
function openWaterSettings() {
    const modal = document.getElementById('waterSettingsModal');
    const select = document.getElementById('waterAlertInterval');
    
    if (modal && select) {
        // Define o valor atual
        select.value = waterAlertInterval.toString();
        modal.classList.remove('hidden');
    }
}

/**
 * Fecha o modal de configurações de água
 */
function closeWaterSettings() {
    const modal = document.getElementById('waterSettingsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Salva as configurações de água
 */
async function saveWaterSettings() {
    const select = document.getElementById('waterAlertInterval');
    if (!select) return;
    
    waterAlertInterval = parseInt(select.value, 10);
    
    // Salva no localStorage
    localStorage.setItem('waterAlertInterval', waterAlertInterval.toString());
    
    // Salva no Supabase (perfil do usuário)
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível salvar configuração de água no Supabase');
                return;
            }
            
            // Tenta atualizar ou inserir no perfil do usuário (tabela profiles usa 'id', não 'user_id')
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
                    id: userId,
                    config_alerta_agua: waterAlertInterval,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
            
            if (error) {
                console.warn('Erro ao salvar no Supabase (pode não existir campo config_alerta_agua):', error);
                // Tenta salvar em atividades como fallback
                await supabaseClient
                    .from('atividades')
                    .insert([{
                        user_id: userId,
                        nome_tarefa: 'Configuração - Intervalo Alerta Água',
                        pontuacao: 0,
                        categoria: 'Configuração',
                        regiao: 'sa-east-1',
                        dados_extras: { intervaloAlerta: waterAlertInterval }
                    }]);
            } else {
                console.log('%c⚙️ Configuração salva no Supabase', 'color: #3b82f6; font-weight: bold;');
            }
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
        }
    }
    
    // Reinicia verificação de alerta
    if (waterAlertCheckInterval) {
        clearInterval(waterAlertCheckInterval);
    }
    startWaterAlertCheck();
    
    // Fecha o modal
    closeWaterSettings();
}

/**
 * Inicia a verificação de alerta de água
 */
function startWaterAlertCheck() {
    // Limpa intervalo anterior se existir
    if (waterAlertCheckInterval) {
        clearInterval(waterAlertCheckInterval);
    }
    
    // Se o alerta estiver desativado, não inicia
    if (waterAlertInterval === 0) {
        return;
    }
    
    // Verifica a cada minuto
    waterAlertCheckInterval = setInterval(() => {
        checkWaterAlert();
    }, 60000); // 1 minuto
    
    // Verifica imediatamente
    checkWaterAlert();
}

/**
 * Verifica se deve mostrar alerta de água
 */
function checkWaterAlert() {
    // Se qualquer escudo estiver ativo, silencia alertas
    if (escudoRotinaAtivo || modoEscudoAtivo !== 'desativado') {
        const waterWidget = document.getElementById('waterWidget');
        if (waterWidget) {
            waterWidget.classList.remove('alert');
        }
        return; // Não mostra alertas durante eventos ou modo aventura
    }
    
    // Se o alerta estiver desativado, não verifica
    if (waterAlertInterval === 0) {
        const waterWidget = document.getElementById('waterWidget');
        if (waterWidget) {
            waterWidget.classList.remove('alert');
        }
        return;
    }
    
    // Se não houver último tempo registrado, não alerta
    if (!lastWaterTime) {
        return;
    }
    
    const now = Date.now();
    const timeSinceLastWater = (now - lastWaterTime) / 1000 / 60; // em minutos
    const alertIntervalMinutes = waterAlertInterval;
    
    const waterWidget = document.getElementById('waterWidget');
    
    if (timeSinceLastWater >= alertIntervalMinutes) {
        // Ativa alerta
        if (waterWidget) {
            waterWidget.classList.add('alert');
        }
        
        // Vibração leve (mobile)
        if (navigator.vibrate) {
            // Verifica se é mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                            (window.innerWidth <= 768 && 'ontouchstart' in window);
            if (isMobile) {
                navigator.vibrate([100, 50, 100]);
            }
        }
    } else {
        // Remove alerta
        if (waterWidget) {
            waterWidget.classList.remove('alert');
        }
    }
}

// Widget de Timer de Foco
/**
 * Expande o timer de foco
 */
function expandFocusTimer() {
    // Tenta abrir modal primeiro
    const modal = document.getElementById('limpezaTimerModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Sincroniza estado
        const collapsed = document.getElementById('focusTimerCollapsed');
        const expanded = document.getElementById('focusTimerExpanded');
        if (collapsed) collapsed.classList.add('hidden');
        if (expanded) expanded.classList.remove('hidden');
        atualizarEstadoWidgets();
        startFocusTimer();
        return;
    }
    
    // Fallback para widget antigo
    const collapsed = document.getElementById('focusTimerCollapsed');
    const expanded = document.getElementById('focusTimerExpanded');
    
    if (collapsed) collapsed.classList.add('hidden');
    if (expanded) expanded.classList.remove('hidden');
    
    // Atualiza status-bar
    atualizarEstadoWidgets();
    
    // Inicia o timer automaticamente
    startFocusTimer();
}

/**
 * Colapsa o timer de foco
 */
function collapseFocusTimer() {
    const collapsed = document.getElementById('focusTimerCollapsed');
    const expanded = document.getElementById('focusTimerExpanded');
    
    if (collapsed) collapsed.classList.remove('hidden');
    if (expanded) expanded.classList.add('hidden');
    
    // Atualiza status-bar
    atualizarEstadoWidgets();
    
    // Pausa o timer
    pauseFocusTimer();
}

/**
 * Inicia o timer de foco
 */
function startFocusTimer() {
    if (focusTimerIsRunning) return;
    
    focusTimerIsRunning = true;
    focusTimerStartTime = Date.now() - ((600 - focusTimerRemaining) * 1000);
    
    // Atualiza botões
    const pauseBtn = document.getElementById('focusPauseBtn');
    const resumeBtn = document.getElementById('focusResumeBtn');
    const pauseBtnModal = document.getElementById('focusPauseBtn-modal');
    const resumeBtnModal = document.getElementById('focusResumeBtn-modal');
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    if (pauseBtnModal) pauseBtnModal.classList.remove('hidden');
    if (resumeBtnModal) resumeBtnModal.classList.add('hidden');
    
    // Limpa intervalo anterior se existir (prevenção de múltiplos timers)
    if (focusTimerInterval) {
        clearInterval(focusTimerInterval);
    }
    
    focusTimerInterval = setInterval(() => {
        try {
            const elapsed = Math.floor((Date.now() - focusTimerStartTime) / 1000);
            focusTimerRemaining = Math.max(0, 600 - elapsed);
            
            updateFocusTimerDisplay();
            
            if (focusTimerRemaining <= 0) {
                finishFocusTimer();
            }
        } catch (error) {
            console.error('❌ Erro no timer de foco:', error);
            if (focusTimerInterval) {
                clearInterval(focusTimerInterval);
                focusTimerInterval = null;
            }
        }
    }, 1000);
    
    updateFocusTimerDisplay();
}

/**
 * Pausa o timer de foco
 */
function pauseFocusTimer() {
    if (!focusTimerIsRunning) return;
    
    focusTimerIsRunning = false;
    if (focusTimerInterval) {
        clearInterval(focusTimerInterval);
        focusTimerInterval = null;
    }
    
    // Atualiza botões
    const pauseBtn = document.getElementById('focusPauseBtn');
    const resumeBtn = document.getElementById('focusResumeBtn');
    const pauseBtnModal = document.getElementById('focusPauseBtn-modal');
    const resumeBtnModal = document.getElementById('focusResumeBtn-modal');
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (resumeBtn) resumeBtn.classList.remove('hidden');
    if (pauseBtnModal) pauseBtnModal.classList.add('hidden');
    if (resumeBtnModal) resumeBtnModal.classList.remove('hidden');
}

/**
 * Continua o timer de foco
 */
function resumeFocusTimer() {
    if (focusTimerIsRunning) return;
    startFocusTimer();
}

/**
 * Finaliza o timer de foco manualmente ou quando termina
 */
async function finishFocusTimer() {
    // Para o timer
    if (focusTimerInterval) {
        clearInterval(focusTimerInterval);
        focusTimerInterval = null;
    }
    
    focusTimerIsRunning = false;
    
    // Vibração
    if (navigator.vibrate) {
        // Vibração longa para indicar conclusão
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Salva no Supabase
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível salvar limpeza no Supabase');
                return;
            }
            
            await supabaseClient
                .from('atividades')
                .insert([{
                    user_id: userId,
                    nome_tarefa: 'Organizar a casa (10 min)',
                    pontuacao: 15,
                    categoria: 'Ordem',
                    regiao: 'sa-east-1'
                }]);
            console.log('%c🧹 Registro de limpeza salvo no Supabase', 'color: #f97316; font-weight: bold;');
        } catch (error) {
            console.error('Erro ao salvar limpeza no Supabase:', error);
        }
    }
    
    // Reseta o timer
    focusTimerRemaining = 600;
    updateFocusTimerDisplay();
    
    // Colapsa o widget
    collapseFocusTimer();
    
    // Confetes de celebração
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.9 },
            colors: ['#f97316', '#fb923c', '#fdba74']
        });
    }
    
    // Atualiza pontos se o sistema existir
    if (window.pointsSystem) {
        window.pointsSystem.addPoints(15);
    }
}

/**
 * Atualiza o display do timer de foco
 */
function updateFocusTimerDisplay() {
    const display = document.getElementById('focusTimerDisplay');
    const displayModal = document.getElementById('focusTimerDisplay-modal');
    const minutes = Math.floor(focusTimerRemaining / 60);
    const seconds = focusTimerRemaining % 60;
    const tempoFormatado = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (display) {
        display.textContent = tempoFormatado;
    }
    if (displayModal) {
        displayModal.textContent = tempoFormatado;
    }
}

// ============================================
// MENU DE AÇÕES RÁPIDAS (FAB) E MODO AVENTURA
// ============================================

/**
 * Atualiza o menu FAB baseado no estado do escudo
 */
function atualizarMenuFABEscudo() {
    const fabEscudoItem = document.getElementById('fabEscudoCompromisso');
    const fabEscudoLabel = document.getElementById('fabEscudoLabel');
    const isEscudoAtivo = document.body.classList.contains('escudo-compromisso');
    
    if (fabEscudoItem && fabEscudoLabel) {
        if (isEscudoAtivo) {
            // Escudo ativo: mostra "Desativar Escudo" e adiciona pulsação
            fabEscudoLabel.textContent = 'Desativar Escudo';
            fabEscudoItem.classList.add('escudo-ativo-pulsante');
        } else {
            // Escudo inativo: mostra "Escudo de Compromisso" e remove pulsação
            fabEscudoLabel.textContent = 'Escudo de Compromisso';
            fabEscudoItem.classList.remove('escudo-ativo-pulsante');
        }
    }
}

/**
 * Abre/fecha o menu FAB
 */
function toggleFAB() {
    const fabMenu = document.getElementById('fabMenu');
    const fabMainBtn = document.getElementById('fabMainBtn');
    const fabMainIcon = document.getElementById('fabMainIcon');
    
    if (!fabMenu || !fabMainBtn) return;
    
    // Atualiza o menu do escudo antes de abrir
    atualizarMenuFABEscudo();
    
    // Toggle do menu usando hidden
    fabMenu.classList.toggle('hidden');
    fabMenuAberto = !fabMenuAberto;
    
    // Animação de feedback visual no botão (scale-110)
    fabMainBtn.style.transform = 'scale(1.1)';
    setTimeout(() => {
        fabMainBtn.style.transform = '';
    }, 150);
    
    // Mantém classes active para compatibilidade
    if (fabMenuAberto) {
        fabMenu.classList.add('active');
        if (modoEscudoAtivo === 'desativado') {
            fabMainBtn.classList.add('active');
        }
    } else {
        fabMenu.classList.remove('active');
        if (modoEscudoAtivo === 'desativado') {
            fabMainBtn.classList.remove('active');
        }
    }
}

/**
 * Fecha o menu FAB
 */
function closeFAB() {
    if (fabMenuAberto) {
        toggleFAB();
    }
}

/**
 * Ver agenda de eventos
 */
function verAgenda() {
    const modal = document.getElementById('agendaModal');
    const agendaList = document.getElementById('agendaList');
    
    if (!modal || !agendaList) return;
    
    // Limpa lista anterior
    agendaList.innerHTML = '';
    
    // Filtra eventos de hoje
    const hoje = getLocalDateString();
    const eventosHoje = eventosAgenda.filter(e => e.data === hoje);
    
    if (eventosHoje.length === 0) {
        agendaList.innerHTML = '<p class="text-gray-400 text-center py-4">Nenhum evento agendado para hoje</p>';
    } else {
        eventosHoje.forEach(evento => {
            const item = document.createElement('div');
            item.className = 'rounded-xl p-4 border border-gray-800 mb-3';
            item.style.backgroundColor = '#1a1a1a';
            
            const [hora, minuto] = evento.hora.split(':');
            const horaFim = new Date();
            horaFim.setHours(parseInt(hora), parseInt(minuto) + evento.duracao, 0, 0);
            const horaFimStr = horaFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            item.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="font-semibold text-white mb-1">${evento.titulo}</h4>
                        <p class="text-sm text-gray-400">${evento.hora} - ${horaFimStr}</p>
                        <span class="inline-block mt-2 px-2 py-1 text-xs rounded-lg bg-indigo-500/20 text-indigo-400">${evento.tipo}</span>
                    </div>
                </div>
            `;
            
            agendaList.appendChild(item);
        });
    }
    
    modal.classList.remove('hidden');
}

/**
 * Fecha modal de agenda
 */
function closeAgendaModal() {
    const modal = document.getElementById('agendaModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Ativa/desativa Modo Aventura
 */
async function toggleModoAventura() {
    modoAventuraAtivo = !modoAventuraAtivo;
    
    const body = document.body;
    const fabMainBtn = document.getElementById('fabMainBtn');
    const fabMainIcon = document.getElementById('fabMainIcon');
    const fabShieldIcon = document.getElementById('fabShieldIcon');
    const fabShieldLabel = document.getElementById('fabShieldLabel');
    
    if (modoAventuraAtivo) {
        // Ativa escudo visual
        body.classList.add('border-shield');
        
        // Muda ícone do botão
        if (fabMainIcon) fabMainIcon.textContent = '🛡️';
        if (fabMainBtn) fabMainBtn.classList.add('active');
        
        // Atualiza label do item
        if (fabShieldLabel) fabShieldLabel.textContent = 'Desativar Escudo';
        
        // Desativa alertas de água
        if (waterAlertCheckInterval) {
            clearInterval(waterAlertCheckInterval);
            waterAlertCheckInterval = null;
        }
        
        // Remove alerta visual se estiver ativo
        const waterWidget = document.getElementById('waterWidget');
        if (waterWidget) {
            waterWidget.classList.remove('alert');
        }
        
        console.log('%c🛡️ Modo Aventura ATIVADO', 'color: #eab308; font-weight: bold;');
    } else {
        // Desativa escudo visual
        body.classList.remove('border-shield');
        
        // Restaura ícone do botão
        if (fabMainIcon) fabMainIcon.textContent = '+';
        if (fabMainBtn && !fabMenuAberto) {
            fabMainBtn.classList.remove('active');
        }
        
        // Atualiza label do item
        if (fabShieldLabel) fabShieldLabel.textContent = 'Ativar Escudo';
        
        // Reativa alertas de água se configurado
        if (waterAlertInterval > 0) {
            startWaterAlertCheck();
        }
        
        console.log('%c🛡️ Modo Aventura DESATIVADO', 'color: #f59e0b; font-weight: bold;');
    }
    
    // Salva estado no localStorage
    localStorage.setItem('modoAventuraAtivo', modoAventuraAtivo.toString());
    
    // Salva no Supabase (perfil do usuário)
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível salvar modo aventura no Supabase');
                return;
            }
            
            // Tenta atualizar/inserir no perfil (tabela profiles usa 'id', não 'user_id')
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
                    id: userId,
                    modo_aventura_ativo: modoAventuraAtivo,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
            
            if (error) {
                console.warn('Erro ao salvar no Supabase (pode não existir campo modo_aventura_ativo):', error);
                // Fallback: salva em atividades
                await supabaseClient
                    .from('atividades')
                    .insert([{
                        user_id: userId,
                        nome_tarefa: `Modo Aventura ${modoAventuraAtivo ? 'Ativado' : 'Desativado'}`,
                        pontuacao: 0,
                        categoria: 'Configuração',
                        regiao: 'sa-east-1',
                        dados_extras: { modoAventuraAtivo: modoAventuraAtivo }
                    }]);
            } else {
                console.log('%c💾 Estado do Modo Aventura salvo no Supabase', 'color: #10b981; font-weight: bold;');
            }
        } catch (error) {
            console.error('Erro ao salvar modo aventura:', error);
        }
    }
}

/**
 * Carrega estado do Modo Aventura
 */
async function loadModoAventura() {
    // Carrega do localStorage primeiro
    const saved = localStorage.getItem('modoAventuraAtivo');
    if (saved === 'true') {
        modoAventuraAtivo = true;
    }
    
    // Tenta carregar do Supabase
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('perfil')
                .select('modo_aventura_ativo')
                .limit(1)
                .single();
            
            if (!error && data && data.modo_aventura_ativo !== null) {
                modoAventuraAtivo = data.modo_aventura_ativo;
                localStorage.setItem('modoAventuraAtivo', modoAventuraAtivo.toString());
            }
        } catch (error) {
            console.warn('Erro ao carregar do Supabase:', error);
        }
    }
    
    // Aplica estado visual se estiver ativo
    if (modoAventuraAtivo) {
        const body = document.body;
        const fabMainIcon = document.getElementById('fabMainIcon');
        const fabMainBtn = document.getElementById('fabMainBtn');
        
        body.classList.add('border-shield');
        if (fabMainIcon) fabMainIcon.textContent = '🛡️';
        if (fabMainBtn) fabMainBtn.classList.add('active');
        
        // Desativa alertas
        if (waterAlertCheckInterval) {
            clearInterval(waterAlertCheckInterval);
            waterAlertCheckInterval = null;
        }
    }
}

// ============================================
// SISTEMA DE ESCUDOS (COMPROMISSO E RECUPERAÇÃO)
// ============================================

/**
 * Ativa Escudo de Compromisso (2 horas padrão, ou 1h30 para Hiperfocado, ou tempo customizado)
 * @param {number} [minutosCustomizados] - Minutos customizados (opcional)
 */
async function ativarEscudoCompromisso(minutosCustomizados = null) {
    // Desativa qualquer escudo anterior
    desativarTodosEscudos();
    
    modoEscudoAtivo = 'compromisso';
    
    // Se minutos customizados foram fornecidos, usa eles
    // Caso contrário, usa padrão: 2 horas (ou 1h30 para Hiperfocado)
    let duracaoMinutos = minutosCustomizados || 120; // 2 horas padrão
    if (!minutosCustomizados && window.userProfile && window.userProfile.classe === 'O Hiperfocado') {
        duracaoMinutos = 90; // 1h30 para Hiperfocado
        console.log('%c🎯 Escudo de Compromisso reduzido para 1h30 (Hiperfocado)', 'color: #3b82f6; font-weight: bold;');
    }
    
    escudoCompromissoTempoRestante = duracaoMinutos * 60; // em segundos
    
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    // Aplica classe no body para compatibilidade
    body.classList.add('escudo-compromisso', 'border-shield-compromisso');
    body.classList.remove('border-shield-recuperacao', 'modo-recuperacao', 'escudo-recuperacao');
    
    // Ativa a aura amarela sobreposta
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 aura-amarela';
    }
    
    // Desativa alertas de água
    if (waterAlertCheckInterval) {
        clearInterval(waterAlertCheckInterval);
        waterAlertCheckInterval = null;
    }
    
    const waterWidget = document.getElementById('waterWidget');
    if (waterWidget) {
        waterWidget.classList.remove('alert');
    }
    
    // Calcula quando expira
    const expiraEm = new Date();
    expiraEm.setMinutes(expiraEm.getMinutes() + duracaoMinutos);
    
    // Salva no Supabase
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível salvar escudo no Supabase');
                return;
            }
            
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
                    id: userId,
                    modo_escudo: 'compromisso',
                    escudo_expira_em: expiraEm.toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
            
            if (error) {
                console.warn('Erro ao salvar escudo no Supabase:', error);
            } else {
                console.log('%c🛡️ Escudo de Compromisso ativado', 'color: #ffff00; font-weight: bold;');
            }
        } catch (error) {
            console.error('Erro ao salvar escudo:', error);
        }
    }
    
    // Salva no localStorage
    localStorage.setItem('modoEscudoAtivo', modoEscudoAtivo);
    localStorage.setItem('escudoCompromissoTempoRestante', escudoCompromissoTempoRestante.toString());
    localStorage.setItem('escudoExpiraEm', expiraEm.toISOString());
    
                // Inicia timer (já atualiza cronômetro visual)
                iniciarTimerCompromisso();
                
                // Garante que o cronômetro está visível
                atualizarCronometroEscudo();
    
    // Atualiza menu FAB
    atualizarMenuFABEscudo();
}

/**
 * Alterna o Escudo de Compromisso (ativa se desativado, desativa se ativo)
 */
async function alternarEscudoCompromisso() {
    const body = document.body;
    
    // Se já estiver ativo (body tem a classe escudo-compromisso), desativa
    if (body.classList.contains('escudo-compromisso')) {
        // Remove IMEDIATAMENTE a aura amarela
        const aura = document.getElementById('aura-escudo');
        if (aura) {
            aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
            aura.classList.remove('aura-amarela');
        }
        
        // Remove todas as classes do body IMEDIATAMENTE
        body.classList.remove('escudo-compromisso', 'border-shield-compromisso', 'aura-amarela');
        
        // Limpa o status no Supabase IMEDIATAMENTE
        await desativarEscudoCompromissoCompleto();
        
        // Mostra modal de feedback
        mostrarModalFeedbackEscudo();
        
        // Atualiza menu FAB
        atualizarMenuFABEscudo();
        return;
    }

    // Se não tem a classe, pergunta o tempo e ativa
    const minutos = prompt("Quanto tempo de compromisso? (em minutos)", "120");
    
    if (minutos && !isNaN(minutos)) {
        await ativarEscudoCompromisso(parseInt(minutos));
        atualizarMenuFABEscudo();
    }
}

/**
 * Desativa o Escudo de Compromisso e limpa o timer no Supabase
 */
async function desativarEscudoCompromissoCompleto() {
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    // Remove IMEDIATAMENTE a aura amarela
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
        aura.classList.remove('aura-amarela');
    }
    
    // Remove todas as classes de escudo e aura IMEDIATAMENTE
    body.classList.remove('escudo-compromisso', 'border-shield-compromisso', 'aura-amarela', 'escudo-recuperacao', 'border-shield-recuperacao', 'modo-recuperacao');
    
    // Para timer de compromisso se estiver ativo
    if (escudoCompromissoInterval) {
        clearInterval(escudoCompromissoInterval);
        escudoCompromissoInterval = null;
    }
    
    // Limpa o timer no Supabase IMEDIATAMENTE
    const client = getSupabaseClient();
    if (client && window.currentUser?.id) {
        try {
            await client
                .from('profiles')
                .update({
                    modo_escudo: 'desativado',
                    escudo_expira_em: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', window.currentUser.id);
            
            console.log('%c🛡️ Escudo de Compromisso desativado e limpo no Supabase', 'color: #10b981; font-weight: bold;');
        } catch (error) {
            console.error('Erro ao limpar escudo no Supabase:', error);
        }
    }
    
    // Limpa localStorage
    localStorage.removeItem('modoEscudoAtivo');
    localStorage.removeItem('escudoCompromissoTempoRestante');
    localStorage.removeItem('escudoExpiraEm');
    
    modoEscudoAtivo = 'desativado';
    
    // Reativa alertas de água
    if (waterAlertCheckInterval) {
        startWaterAlertCheck();
    }
}

/**
 * Inicia timer do Escudo de Compromisso
 */
function iniciarTimerCompromisso() {
    // Limpa timer anterior se existir
    if (escudoCompromissoInterval) {
        clearInterval(escudoCompromissoInterval);
    }
    
    // Atualiza cronômetro visual imediatamente
    atualizarCronometroEscudo();
    
    // Limpa intervalo anterior se existir (prevenção de múltiplos timers)
    if (escudoCompromissoInterval) {
        clearInterval(escudoCompromissoInterval);
    }
    
    escudoCompromissoInterval = setInterval(() => {
        try {
            escudoCompromissoTempoRestante--;
            
            // Salva tempo restante
            localStorage.setItem('escudoCompromissoTempoRestante', escudoCompromissoTempoRestante.toString());
            
            // Atualiza cronômetro visual
            atualizarCronometroEscudo();
            
            if (escudoCompromissoTempoRestante <= 0) {
                finalizarEscudoCompromisso();
            }
        } catch (error) {
            console.error('❌ Erro no timer de escudo:', error);
            if (escudoCompromissoInterval) {
                clearInterval(escudoCompromissoInterval);
                escudoCompromissoInterval = null;
            }
        }
    }, 1000);
}

/**
 * Atualiza o cronômetro visual do escudo no header-rpg
 */
function atualizarCronometroEscudo() {
    const timerElement = document.getElementById('escudoTimer');
    if (!timerElement) return;
    
    // Verifica se há escudo ativo com tempo
    if (modoEscudoAtivo !== 'compromisso' || escudoCompromissoTempoRestante <= 0) {
        timerElement.classList.add('hidden');
        timerElement.classList.remove('timer-urgente');
        return;
    }
    
    // Mostra o cronômetro
    timerElement.classList.remove('hidden');
    
    // Calcula minutos e segundos
    const minutos = Math.floor(escudoCompromissoTempoRestante / 60);
    const segundos = escudoCompromissoTempoRestante % 60;
    const tempoFormatado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    
    timerElement.textContent = `🛡️ ${tempoFormatado}`;
    
    // Se faltar 1 minuto ou menos, adiciona classe de urgência
    if (escudoCompromissoTempoRestante <= 60) {
        timerElement.classList.add('timer-urgente');
    } else {
        timerElement.classList.remove('timer-urgente');
    }
}

/**
 * Finaliza Escudo de Compromisso automaticamente
 */
async function finalizarEscudoCompromisso() {
    // Para o timer
    if (escudoCompromissoInterval) {
        clearInterval(escudoCompromissoInterval);
        escudoCompromissoInterval = null;
    }
    
    // Remove cronômetro visual
    atualizarCronometroEscudo();
    
    // Remove IMEDIATAMENTE a aura amarela
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    // Remove todas as classes de escudo e aura IMEDIATAMENTE
    body.classList.remove('border-shield-compromisso', 'escudo-compromisso', 'aura-amarela');
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
        aura.classList.remove('aura-amarela');
    }
    
    modoEscudoAtivo = 'desativado';
    
    // Limpa o estado no Supabase IMEDIATAMENTE
    const client = getSupabaseClient();
    if (client && window.currentUser?.id) {
        try {
            await client
                .from('profiles')
                .update({
                    modo_escudo: 'desativado',
                    escudo_expira_em: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', window.currentUser.id);
        } catch (error) {
            console.error('Erro ao atualizar escudo:', error);
        }
    }
    
    // Limpa localStorage
    localStorage.removeItem('modoEscudoAtivo');
    localStorage.removeItem('escudoCompromissoTempoRestante');
    localStorage.removeItem('escudoExpiraEm');
    
    // Reativa alertas de água
    if (waterAlertInterval > 0) {
        startWaterAlertCheck();
    }
    
    // Envia notificação nativa
    await enviarNotificacaoEscudoExpirado();
    
    // Mostra modal de feedback
    mostrarModalFeedbackEscudo();
    
    console.log('%c🛡️ Escudo de Compromisso finalizado', 'color: #f59e0b; font-weight: bold;');
}

/**
 * Envia notificação nativa quando o Escudo de Compromisso expira
 */
async function enviarNotificacaoEscudoExpirado() {
    if (!capacitorAvailable || !LocalNotifications) {
        // Fallback: usa Notification API do navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🛡️ Escudo Expirado', {
                body: 'Seu Escudo expirou! Como você está se sentindo?',
                icon: '/favicon.ico',
                tag: 'escudo-expirado'
            });
        }
        return;
    }
    
    try {
        await LocalNotifications.schedule({
            notifications: [{
                id: 999999, // ID fixo para notificação de escudo
                title: '🛡️ Escudo Expirado',
                body: 'Seu Escudo expirou! Como você está se sentindo?',
                sound: 'default', // Som padrão de alarme do sistema
                schedule: {
                    at: new Date() // Dispara imediatamente
                }
            }]
        });
        
        console.log('%c🔔 Notificação de escudo expirado enviada', 'color: #10b981; font-weight: bold;');
    } catch (error) {
        console.error('Erro ao enviar notificação de escudo:', error);
    }
}

/**
 * Mostra modal de feedback do Escudo de Compromisso
 */
function mostrarModalFeedbackEscudo() {
    const modal = document.getElementById('feedbackEscudoModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Fecha modal de feedback
 */
function fecharModalFeedbackEscudo() {
    const modal = document.getElementById('feedbackEscudoModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Garante que a tela voltou ao estado normal (Preto AMOLED)
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    body.classList.remove('escudo-compromisso', 'border-shield-compromisso', 'aura-amarela', 'aura-roxa');
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
        aura.classList.remove('aura-amarela', 'aura-roxa');
    }
}

/**
 * Fecha notificação de compromisso e remove banner/aura
 */
function fecharNotificacaoCompromisso() {
    // Remove banner de escudo de rotina
    const bannerEscudo = document.getElementById('escudoRotinaIndicador');
    if (bannerEscudo) {
        bannerEscudo.classList.add('hidden');
    }
    
    // Remove banner de compromisso (se existir)
    const bannerCompromisso = document.getElementById('escudoCompromissoIndicador');
    if (bannerCompromisso) {
        bannerCompromisso.classList.add('hidden');
    }
    
    // Remove notificação de compromisso (se existir)
    const notificacao = document.getElementById('compromissoNotificacao');
    if (notificacao) {
        notificacao.classList.add('hidden');
    }
    
    // Remove aura amarela
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    body.classList.remove('escudo-compromisso', 'border-shield-compromisso', 'aura-amarela', 'aura-roxa');
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
        aura.classList.remove('aura-amarela', 'aura-roxa');
    }
    
    console.log('✅ Notificação de compromisso fechada e aura removida');
}

/**
 * Salva feedback do Escudo de Compromisso
 */
async function salvarFeedbackEscudo(emoji) {
    // Remove IMEDIATAMENTE a aura amarela e o banner antes de salvar
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    const bannerEscudo = document.getElementById('escudoRotinaIndicador');
    const bannerCompromisso = document.getElementById('escudoCompromissoIndicador');
    
    // Remove todas as classes de escudo e aura IMEDIATAMENTE
    body.classList.remove('escudo-compromisso', 'border-shield-compromisso', 'aura-amarela', 'aura-roxa');
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
        aura.classList.remove('aura-amarela', 'aura-roxa');
    }
    
    // Remove banners IMEDIATAMENTE
    if (bannerEscudo) {
        bannerEscudo.classList.add('hidden');
    }
    if (bannerCompromisso) {
        bannerCompromisso.classList.add('hidden');
    }
    
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        console.warn('Usuário não autenticado, não será possível salvar feedback');
        fecharModalFeedbackEscudo();
        return;
    }
    
    try {
        // Salva no historico_atividades com humor_emoji e tipo 'Encerramento de Escudo'
        await client
            .from('historico_atividades')
            .insert([{
                user_id: window.currentUser.id,
                missao_id: 'checkin-humor-' + Date.now(),
                nome_missao: 'Check-in de Humor',
                tipo_missao: 'Encerramento de Escudo',
                categoria: 'Escudo',
                humor_emoji: emoji,
                recompensa: 0,
                pontuacao: 0,
                origem: 'sistema',
                dados_extras: {
                    tipo: 'checkin_humor',
                    timestamp: new Date().toISOString()
                }
            }]);
        
        console.log('%c✅ Check-in de Humor salvo:', 'color: #10b981; font-weight: bold;', emoji);
    } catch (error) {
        console.error('Erro ao salvar check-in de humor:', error);
    }
    
    // Fecha modal e limpa estado
    fecharModalFeedbackEscudo();
}

// Expor função globalmente
window.salvarFeedbackEscudo = salvarFeedbackEscudo;

/**
 * Ativa Escudo de Recuperação
 */
async function ativarEscudoRecuperacao() {
    // Desativa qualquer escudo anterior
    desativarTodosEscudos();
    
    modoEscudoAtivo = 'recuperacao';
    
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    body.classList.add('border-shield-recuperacao', 'modo-recuperacao', 'escudo-recuperacao');
    body.classList.remove('border-shield-compromisso', 'escudo-compromisso');
    
    // Ativa a aura roxa sobreposta
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 aura-roxa';
    }
    
    // Mostra overlay
    const overlay = document.getElementById('recuperacaoOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
    
    // Desativa alertas de água
    if (waterAlertCheckInterval) {
        clearInterval(waterAlertCheckInterval);
        waterAlertCheckInterval = null;
    }
    
    const waterWidget = document.getElementById('waterWidget');
    if (waterWidget) {
        waterWidget.classList.remove('alert');
    }
    
    // Salva no Supabase
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível salvar escudo no Supabase');
                return;
            }
            
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
                    id: userId,
                    modo_escudo: 'recuperacao',
                    escudo_expira_em: null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
            
            if (error) {
                console.warn('Erro ao salvar escudo no Supabase:', error);
            } else {
                console.log('%c🧘‍♂️ Escudo de Recuperação ativado', 'color: #6366f1; font-weight: bold;');
            }
        } catch (error) {
            console.error('Erro ao salvar escudo:', error);
        }
    }
    
    // Salva no localStorage
    localStorage.setItem('modoEscudoAtivo', modoEscudoAtivo);
    localStorage.removeItem('escudoCompromissoTempoRestante');
    localStorage.removeItem('escudoExpiraEm');
}

/**
 * Desativa Escudo de Recuperação
 */
async function desativarEscudoRecuperacao() {
    // Remove borda e classes
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    // Desativa a aura imediatamente
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
    }
    
    body.classList.remove('border-shield-recuperacao', 'modo-recuperacao', 'escudo-recuperacao');
    
    // Esconde overlay
    const overlay = document.getElementById('recuperacaoOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    
    modoEscudoAtivo = 'desativado';
    
    // Salva no Supabase
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível salvar escudo no Supabase');
                return;
            }
            
            await supabaseClient
                .from('profiles')
                .upsert({
                    id: userId,
                    modo_escudo: 'desativado',
                    escudo_expira_em: null,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
        } catch (error) {
            console.error('Erro ao atualizar escudo:', error);
        }
    }
    
    // Limpa localStorage
    localStorage.removeItem('modoEscudoAtivo');
    
    // Reativa alertas de água
    if (waterAlertInterval > 0) {
        startWaterAlertCheck();
    }
    
    console.log('%c🧘‍♂️ Escudo de Recuperação desativado', 'color: #10b981; font-weight: bold;');
}

/**
 * Desativa todos os escudos e remove sombras instantaneamente
 */
function desativarTodosEscudos() {
    // Para timer de compromisso se estiver ativo
    if (escudoCompromissoInterval) {
        clearInterval(escudoCompromissoInterval);
        escudoCompromissoInterval = null;
    }
    
    // Remove todas as classes de escudo instantaneamente
    const body = document.body;
    const aura = document.getElementById('aura-escudo');
    
    // Desativa a aura imediatamente
    if (aura) {
        aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 opacity-0';
    }
    
    body.classList.remove(
        'escudo-compromisso', 
        'border-shield-compromisso', 
        'escudo-recuperacao',
        'border-shield-recuperacao', 
        'modo-recuperacao'
    );
    
    // Esconde overlay de recuperação
    const overlay = document.getElementById('recuperacaoOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Verifica se o escudo de compromisso expirou
 */
let checkEscudoTimerInterval = null;

async function checkEscudoTimer() {
    // Só verifica se o escudo de compromisso estiver ativo
    if (!document.body.classList.contains('escudo-compromisso')) {
        return;
    }
    
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        return;
    }
    
    try {
        const { data, error } = await client
            .from('profiles')
            .select('escudo_expira_em')
            .eq('id', window.currentUser.id)
            .single();
        
        if (error) {
            console.warn('Erro ao verificar timer do escudo:', error);
            return;
        }
        
        if (data && data.escudo_expira_em) {
            const expiraEm = new Date(data.escudo_expira_em);
            const agora = new Date();
            
            // Se a hora atual for maior que escudo_expira_em, desativa
            if (agora >= expiraEm) {
                console.log('%c⏰ Escudo de Compromisso expirou automaticamente', 'color: #f59e0b; font-weight: bold;');
                await desativarEscudoCompromissoCompleto();
                atualizarMenuFABEscudo();
            }
        }
    } catch (error) {
        console.error('Erro ao verificar timer do escudo:', error);
    }
}

/**
 * Inicia a verificação periódica do timer do escudo (a cada 1 minuto)
 */
function iniciarCheckEscudoTimer() {
    // Limpa intervalo anterior se existir
    if (checkEscudoTimerInterval) {
        clearInterval(checkEscudoTimerInterval);
    }
    
    // Verifica imediatamente
    checkEscudoTimer();
    
    // Configura para verificar a cada 1 minuto (60000ms)
    // Otimização: Verifica a cada 60 segundos (limite para evitar crashes)
    checkEscudoTimerInterval = setInterval(checkEscudoTimer, 60000); // 60 segundos
    
    console.log('✅ Verificação periódica do escudo iniciada (a cada 60 segundos)');
}

/**
 * Carrega estado dos Escudos
 */
async function loadEstadoEscudos() {
    // Carrega do localStorage primeiro
    const modoSalvo = localStorage.getItem('modoEscudoAtivo');
    const tempoRestante = localStorage.getItem('escudoCompromissoTempoRestante');
    const expiraEm = localStorage.getItem('escudoExpiraEm');
    
    if (modoSalvo) {
        modoEscudoAtivo = modoSalvo;
        
        if (modoEscudoAtivo === 'compromisso' && tempoRestante && expiraEm) {
            // Verifica se ainda não expirou
            const expiraEmDate = new Date(expiraEm);
            const agora = new Date();
            
            if (agora < expiraEmDate) {
                // Calcula tempo restante real
                escudoCompromissoTempoRestante = Math.floor((expiraEmDate - agora) / 1000);
                
                // Ativa visualmente
                const body = document.body;
                const aura = document.getElementById('aura-escudo');
                
                body.classList.add('border-shield-compromisso', 'escudo-compromisso');
                
                // Ativa a aura amarela sobreposta
                if (aura) {
                    aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 aura-amarela';
                }
                
                // Inicia timer (já atualiza cronômetro visual)
                iniciarTimerCompromisso();
                
                // Garante que o cronômetro está visível
                atualizarCronometroEscudo();
            } else {
                // Expirou, limpa
                modoEscudoAtivo = 'desativado';
                localStorage.removeItem('modoEscudoAtivo');
                localStorage.removeItem('escudoCompromissoTempoRestante');
                localStorage.removeItem('escudoExpiraEm');
            }
        } else if (modoEscudoAtivo === 'recuperacao') {
            // Ativa visualmente
            const body = document.body;
            body.classList.add('border-shield-recuperacao', 'modo-recuperacao');
            
            const overlay = document.getElementById('recuperacaoOverlay');
            if (overlay) {
                overlay.classList.remove('hidden');
            }
        }
    }
    
    // Tenta carregar do Supabase
    if (supabaseClient) {
        try {
            // Usa variável global currentUser.id (garante RLS do Supabase)
            const userId = window.currentUser?.id;
            if (!userId) {
                console.warn('Usuário não autenticado, não será possível carregar escudo do Supabase');
                return;
            }
            
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('modo_escudo, escudo_expira_em')
                .eq('id', userId)
                .single();
            
            if (!error && data) {
                if (data.modo_escudo && data.modo_escudo !== 'desativado') {
                    modoEscudoAtivo = data.modo_escudo;
                    
                    if (modoEscudoAtivo === 'compromisso' && data.escudo_expira_em) {
                        const expiraEmDate = new Date(data.escudo_expira_em);
                        const agora = new Date();
                        
                        if (agora < expiraEmDate) {
                            escudoCompromissoTempoRestante = Math.floor((expiraEmDate - agora) / 1000);
                            
                            const body = document.body;
                            const aura = document.getElementById('aura-escudo');
                            
                            body.classList.add('border-shield-compromisso', 'escudo-compromisso');
                            
                            // Ativa a aura amarela sobreposta
                            if (aura) {
                                aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 aura-amarela';
                            }
                            
                            iniciarTimerCompromisso();
                        } else {
                            // Expirou no servidor, atualiza
                            modoEscudoAtivo = 'desativado';
                            // Usa variável global currentUser.id (garante RLS do Supabase)
                            const userId = window.currentUser?.id;
                            if (userId) {
                                await supabaseClient
                                    .from('profiles')
                                    .upsert({
                                        id: userId,
                                        modo_escudo: 'desativado',
                                        escudo_expira_em: null
                                    }, {
                                        onConflict: 'id'
                                    });
                            }
                        }
                    } else if (modoEscudoAtivo === 'recuperacao') {
                        const body = document.body;
                        const aura = document.getElementById('aura-escudo');
                        
                        body.classList.add('border-shield-recuperacao', 'modo-recuperacao', 'escudo-recuperacao');
                        
                        // Ativa a aura roxa sobreposta
                        if (aura) {
                            aura.className = 'pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-500 aura-roxa';
                        }
                        
                        const overlay = document.getElementById('recuperacaoOverlay');
                        if (overlay) {
                            overlay.classList.remove('hidden');
                        }
                    }
                    
                    localStorage.setItem('modoEscudoAtivo', modoEscudoAtivo);
                }
            }
        } catch (error) {
            console.warn('Erro ao carregar escudos do Supabase:', error);
        }
    }
}

// Torna funções acessíveis globalmente
window.addWaterInstant = addWaterInstant;
window.updateWaterWidget = updateWaterWidget;
window.atualizarBarraVisual = atualizarBarraVisual;
window.atualizarVisualAgua = atualizarVisualAgua; // Compatibilidade
window.openWaterSettings = openWaterSettings;
window.closeWaterSettings = closeWaterSettings;
window.saveWaterSettings = saveWaterSettings;
window.expandFocusTimer = expandFocusTimer;
window.collapseFocusTimer = collapseFocusTimer;
window.pauseFocusTimer = pauseFocusTimer;
window.resumeFocusTimer = resumeFocusTimer;
window.finishFocusTimer = finishFocusTimer;
window.concluirEventoAgenda = concluirEventoAgenda;
window.verificarEventosExternos = verificarEventosExternos;
window.toggleFAB = toggleFAB;
window.atualizarMenuFABEscudo = atualizarMenuFABEscudo;
// Expõe funções de escudo globalmente para uso no HTML
window.ativarEscudoCompromisso = ativarEscudoCompromisso;
window.alternarEscudoCompromisso = alternarEscudoCompromisso;
window.desativarEscudoCompromissoCompleto = desativarEscudoCompromissoCompleto;
window.ativarEscudoRecuperacao = ativarEscudoRecuperacao;
window.desativarEscudoRecuperacao = desativarEscudoRecuperacao;
window.getCurrentUserId = getCurrentUserId;
// Redefine a função global com a implementação completa
window.fecharNotificacaoCompromisso = fecharNotificacaoCompromisso;
window.verAgenda = verAgenda;
window.closeAgendaModal = closeAgendaModal;

// ============================================
// SISTEMA DE PERFIL E BIOMETRIA
// ============================================

/**
 * Atualiza a página de perfil com dados do usuário
 */
function atualizarPaginaPerfil() {
    // Verifica Quest Semanal de Biometria quando a página é aberta
    verificarQuestBiometriaSemanal();
    
    // Atualiza dados corporais se o perfil estiver carregado
    if (window.userProfile) {
        const altura = window.userProfile.altura_cm || window.userProfile.altura;
        const peso = window.userProfile.peso_kg || window.userProfile.peso;
        
        const profileAltura = document.getElementById('profileAltura');
        const profilePeso = document.getElementById('profilePeso');
        
        if (profileAltura) {
            profileAltura.textContent = altura ? `${altura} cm` : '-';
        }
        if (profilePeso) {
            profilePeso.textContent = peso ? `${peso} kg` : '-';
        }
    }
    
    // Atualiza pontos
    if (window.pointsSystem && typeof window.pointsSystem.getPoints === 'function') {
        const pointsDisplay = document.getElementById('pointsDisplay');
        if (pointsDisplay) {
            const totalPoints = window.pointsSystem.getPoints();
            const pointsValue = pointsDisplay.querySelector('.text-4xl');
            if (pointsValue) {
                pointsValue.textContent = totalPoints.toLocaleString('pt-BR');
            }
        }
    }
}

/**
 * Atualiza a página de estatísticas com dados do usuário
 */
function atualizarPaginaStats() {
    // Atualiza dados corporais se o perfil estiver carregado
    if (window.userProfile) {
        const altura = window.userProfile.altura_cm || window.userProfile.altura;
        const peso = window.userProfile.peso_kg || window.userProfile.peso;
        
        const statsAltura = document.getElementById('statsAltura');
        const statsPeso = document.getElementById('statsPeso');
        
        if (statsAltura) {
            statsAltura.textContent = altura ? `${altura} cm` : '-';
        }
        if (statsPeso) {
            statsPeso.textContent = peso ? `${peso} kg` : '-';
        }
    }
}

// ============================================
// SISTEMA DE MANUTENÇÃO CORPORAL
// ============================================

let atividadeFisicaTimer = null;
let atividadeFisicaTempoRestante = 30 * 60; // 30 minutos em segundos
let atividadeFisicaPausado = false;
let refeicoesMarcadas = {
    cafe: false,
    almoco: false,
    jantar: false
};
let atividadeFisicaCompleta = false; // Flag para atividade física completada hoje

/**
 * Verifica e reseta refeições diariamente às 00:00
 */
function verificarResetRefeicoes() {
    const hoje = getLocalDateString();
    const ultimoReset = localStorage.getItem('ultimoResetRefeicoes');
    
    if (ultimoReset !== hoje) {
        refeicoesMarcadas = {
            cafe: false,
            almoco: false,
            jantar: false
        };
        atividadeFisicaCompleta = false; // Reseta atividade física também
        localStorage.setItem('ultimoResetRefeicoes', hoje);
        localStorage.setItem('refeicoesMarcadas', JSON.stringify(refeicoesMarcadas));
        atualizarCardsRefeicoes();
        atualizarEstadoWidgets();
    }
}

/**
 * Carrega refeições marcadas do localStorage
 */
function carregarRefeicoesMarcadas() {
    const hoje = getLocalDateString();
    const ultimoReset = localStorage.getItem('ultimoResetRefeicoes');
    
    if (ultimoReset === hoje) {
        const salvo = localStorage.getItem('refeicoesMarcadas');
        if (salvo) {
            try {
                refeicoesMarcadas = JSON.parse(salvo);
            } catch (e) {
                refeicoesMarcadas = { cafe: false, almoco: false, jantar: false };
            }
        }
    } else {
        refeicoesMarcadas = { cafe: false, almoco: false, jantar: false };
    }
    
    atualizarCardsRefeicoes();
}

/**
 * Atualiza visual dos cards de refeição (status-bar)
 */
function atualizarCardsRefeicoes() {
    const tipos = ['cafe', 'almoco', 'jantar'];
    const cores = {
        cafe: '#fbbf24', // Amarelo
        almoco: '#10b981', // Verde
        jantar: '#f97316' // Laranja
    };
    
    tipos.forEach(tipo => {
        // Atualiza card antigo (se existir)
        const card = document.getElementById(`refeicao-${tipo}`);
        if (card) {
            card.classList.remove('opacity-40', 'opacity-100', 'border-green-500/50', 'border-orange-500/50');
            if (refeicoesMarcadas[tipo]) {
                card.classList.add('opacity-40', 'border-green-500/50');
            } else {
                card.classList.add('opacity-100');
            }
        }
        
        // Atualiza status-bar
        const statusBtn = document.getElementById(`status-${tipo}`);
        if (statusBtn) {
            // Remove todas as classes de estado
            statusBtn.classList.remove(
                'status-cafe-marcado', 'status-almoco-marcado', 'status-jantar-marcado',
                'status-refeicao-marcada', 'border-gray-700'
            );
            
            if (refeicoesMarcadas[tipo]) {
                // Refeição marcada: borda colorida e brilho
                statusBtn.classList.add(`status-${tipo}-marcado`, 'status-refeicao-marcada');
                statusBtn.style.borderColor = cores[tipo];
                statusBtn.style.color = cores[tipo];
            } else {
                // Refeição não marcada: borda cinza
                statusBtn.classList.add('border-gray-700');
                statusBtn.style.borderColor = '';
                statusBtn.style.color = '';
            }
        }
    });
    
    // Atualiza também widget de água e movimento
    atualizarEstadoWidgets();
}

/**
 * Atualiza estados visuais dos widgets da status-bar
 */
function atualizarEstadoWidgets() {
    // Status Água - atualiza círculo de progresso
    const statusWater = document.getElementById('status-water');
    const waterCircle = document.getElementById('status-water-circle');
    if (statusWater && waterCircle) {
        const waterAmount = parseInt(localStorage.getItem('waterAmount') || '0', 10);
        const waterTarget = parseInt(localStorage.getItem('waterTarget') || '2000', 10);
        const percentage = Math.min(100, Math.round((waterAmount / waterTarget) * 100));
        
        // Circunferência do círculo: 2 * π * 23 ≈ 144.5
        const circumference = 144.5;
        const offset = circumference - (circumference * percentage / 100);
        waterCircle.style.strokeDashoffset = offset.toString();
        
        // Se completo, muda cor para verde e adiciona classe
        if (percentage >= 100) {
            waterCircle.style.stroke = '#10b981';
            statusWater.classList.add('status-movimento-completo');
            statusWater.style.borderColor = '#10b981';
        } else {
            waterCircle.style.stroke = '#3b82f6';
            statusWater.classList.remove('status-movimento-completo');
            statusWater.style.borderColor = '';
        }
    }
    
    // Status Movimento
    const statusMovimento = document.getElementById('status-movimento');
    if (statusMovimento) {
        statusMovimento.classList.remove('status-movimento-completo', 'border-gray-700');
        if (atividadeFisicaCompleta) {
            statusMovimento.classList.add('status-movimento-completo');
            statusMovimento.style.borderColor = '#10b981';
            statusMovimento.style.color = '#10b981';
        } else {
            statusMovimento.classList.add('border-gray-700');
            statusMovimento.style.borderColor = '';
            statusMovimento.style.color = '';
        }
    }
    
    // Status Limpeza (mantém atualização do widget antigo também)
    const statusLimpeza = document.getElementById('status-limpeza');
    const focusTimerWidget = document.getElementById('focusTimerWidget');
    if (statusLimpeza) {
        statusLimpeza.classList.remove('status-limpeza-ativo', 'border-gray-700');
        // Verifica se o timer está ativo (expanded)
        const focusTimerExpanded = document.getElementById('focusTimerExpanded');
        if (focusTimerExpanded && !focusTimerExpanded.classList.contains('hidden')) {
            statusLimpeza.classList.add('status-limpeza-ativo');
            statusLimpeza.style.borderColor = '#f97316';
            statusLimpeza.style.color = '#f97316';
        } else {
            statusLimpeza.classList.add('border-gray-700');
            statusLimpeza.style.borderColor = '';
            statusLimpeza.style.color = '';
        }
    }
    
    // Widget antigo de água (compatibilidade)
    const waterWidget = document.getElementById('waterWidget');
    if (waterWidget) {
        const waterAmount = parseInt(localStorage.getItem('waterAmount') || '0', 10);
        if (waterAmount >= 2000) {
            waterWidget.classList.add('opacity-40', 'border-green-500/50');
        } else {
            waterWidget.classList.remove('opacity-40');
        }
    }
    
    // Widget antigo de movimento (compatibilidade)
    const movimentoCard = document.getElementById('atividade-fisica-card');
    if (movimentoCard) {
        if (atividadeFisicaCompleta) {
            movimentoCard.classList.add('opacity-40', 'border-green-500/50');
        } else {
            movimentoCard.classList.remove('opacity-40');
        }
    }
}

/**
 * Marca uma refeição como concluída
 */
async function marcarRefeicao(tipo) {
    if (refeicoesMarcadas[tipo]) {
        return; // Já marcado
    }
    
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        alert('Erro: usuário não autenticado');
        return;
    }
    
    try {
        // Salva no Supabase (tabela atividades ou historico_atividades)
        const hoje = getLocalDateString();
        const nomeRefeicao = tipo === 'cafe' ? 'Café da Manhã' : tipo === 'almoco' ? 'Almoço' : 'Jantar';
        
        await client
            .from('atividades')
            .insert([{
                user_id: window.currentUser.id,
                nome_tarefa: nomeRefeicao,
                categoria: 'Saúde',
                data_completada: hoje,
                progresso: 100,
                dados_extras: { tipo: 'refeicao', vitalidade: 10 }
            }]);
        
        // Marca como concluído
        refeicoesMarcadas[tipo] = true;
        localStorage.setItem('refeicoesMarcadas', JSON.stringify(refeicoesMarcadas));
        atualizarCardsRefeicoes();
        
        // Atualiza barra de HP (Vida) e atributos
        atualizarBarrasStatusRPG();
        atualizarAtributosManutencao();
        
        // Desativa aura de refeição se estiver ativa
        if (typeof desativarAuraRefeicao === 'function') {
            desativarAuraRefeicao();
        }
        
        // Adiciona +10 Vitalidade (energia_total)
        if (window.userProfile) {
            const novaEnergia = (window.userProfile.energia_total || 0) + 10;
            await client
                .from('profiles')
                .update({ energia_total: novaEnergia })
                .eq('id', window.currentUser.id);
            
            // Recarrega perfil
            await carregarPerfilUsuario();
            
            // Atualiza display de energia
            const energyDisplay = document.getElementById('energyDisplay');
            if (energyDisplay) {
                energyDisplay.textContent = novaEnergia;
            }
        }
        
        // Confetti leve
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 30,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#f97316', '#fb923c']
            });
        }
    } catch (error) {
        console.error('Erro ao marcar refeição:', error);
        alert('Erro ao marcar refeição. Tente novamente.');
    }
}

// Redefine a função global com a implementação completa
window.marcarRefeicao = marcarRefeicao;

/**
 * Abre o timer de atividade física (modal ou widget antigo)
 */
function abrirTimerAtividadeFisica() {
    // Tenta abrir modal primeiro
    const modal = document.getElementById('movimentoTimerModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Sincroniza estado do modal com o widget antigo
        const timerDiv = document.getElementById('atividade-fisica-timer');
        const inicioDiv = document.getElementById('atividade-fisica-inicio');
        if (timerDiv && !timerDiv.classList.contains('hidden')) {
            document.getElementById('atividade-fisica-timer-modal')?.classList.remove('hidden');
            document.getElementById('atividade-fisica-inicio-modal')?.classList.add('hidden');
        }
        return;
    }
    
    // Fallback para widget antigo
    const timerDiv = document.getElementById('atividade-fisica-timer');
    const inicioDiv = document.getElementById('atividade-fisica-inicio');
    
    if (timerDiv && inicioDiv) {
        timerDiv.classList.remove('hidden');
        inicioDiv.classList.add('hidden');
    }
}

/**
 * Inicia o timer de atividade física
 */
function iniciarAtividadeFisica() {
    if (atividadeFisicaTimer) return; // Já está rodando
    
    atividadeFisicaPausado = false;
    atividadeFisicaTempoRestante = 30 * 60; // 30 minutos
    
    const btnIniciar = document.getElementById('btn-iniciar-atividade');
    const btnPausar = document.getElementById('btn-pausar-atividade');
    const btnFinalizar = document.getElementById('btn-finalizar-atividade');
    const btnIniciarModal = document.getElementById('btn-iniciar-atividade-modal');
    const btnPausarModal = document.getElementById('btn-pausar-atividade-modal');
    const btnFinalizarModal = document.getElementById('btn-finalizar-atividade-modal');
    
    if (btnIniciar) btnIniciar.classList.add('hidden');
    if (btnPausar) btnPausar.classList.remove('hidden');
    if (btnFinalizar) btnFinalizar.classList.add('hidden');
    if (btnIniciarModal) btnIniciarModal.classList.add('hidden');
    if (btnPausarModal) btnPausarModal.classList.remove('hidden');
    if (btnFinalizarModal) btnFinalizarModal.classList.add('hidden');
    
    // Mostra timer no modal
    const timerModal = document.getElementById('atividade-fisica-timer-modal');
    const inicioModal = document.getElementById('atividade-fisica-inicio-modal');
    if (timerModal) timerModal.classList.remove('hidden');
    if (inicioModal) inicioModal.classList.add('hidden');
    
    // Limpa timer anterior se existir (prevenção de múltiplos timers)
    if (atividadeFisicaTimer) {
        clearInterval(atividadeFisicaTimer);
    }
    
    atividadeFisicaTimer = setInterval(() => {
        try {
            if (!atividadeFisicaPausado) {
                atividadeFisicaTempoRestante--;
                
                const display = document.getElementById('atividade-timer-display');
                const displayModal = document.getElementById('atividade-timer-display-modal');
                const minutos = Math.floor(atividadeFisicaTempoRestante / 60);
                const segundos = atividadeFisicaTempoRestante % 60;
                const tempoFormatado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
                
                if (display) {
                    display.textContent = tempoFormatado;
                }
                if (displayModal) {
                    displayModal.textContent = tempoFormatado;
                }
                
                if (atividadeFisicaTempoRestante <= 0) {
                    finalizarAtividadeFisica();
                }
            }
        } catch (error) {
            console.error('❌ Erro no timer de atividade física:', error);
            if (atividadeFisicaTimer) {
                clearInterval(atividadeFisicaTimer);
                atividadeFisicaTimer = null;
            }
        }
    }, 1000);
}

/**
 * Pausa o timer de atividade física
 */
function pausarAtividadeFisica() {
    atividadeFisicaPausado = !atividadeFisicaPausado;
    
    const btnPausar = document.getElementById('btn-pausar-atividade');
    const btnPausarModal = document.getElementById('btn-pausar-atividade-modal');
    const btnResumeModal = document.getElementById('btn-resume-atividade-modal');
    
    if (btnPausar) {
        btnPausar.textContent = atividadeFisicaPausado ? 'Retomar' : 'Pausar';
    }
    if (btnPausarModal && btnResumeModal) {
        if (atividadeFisicaPausado) {
            btnPausarModal.classList.add('hidden');
            btnResumeModal.classList.remove('hidden');
        } else {
            btnPausarModal.classList.remove('hidden');
            btnResumeModal.classList.add('hidden');
        }
    }
}

/**
 * Finaliza a atividade física e ativa brilho de saúde
 */
async function finalizarAtividadeFisica() {
    if (atividadeFisicaTimer) {
        clearInterval(atividadeFisicaTimer);
        atividadeFisicaTimer = null;
    }
    
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        alert('Erro: usuário não autenticado');
        return;
    }
    
    try {
        // Salva no Supabase
        const hoje = getLocalDateString();
        await client
            .from('atividades')
            .insert([{
                user_id: window.currentUser.id,
                nome_tarefa: 'Movimentar o Corpo',
                categoria: 'Saúde',
                data_completada: hoje,
                progresso: 100,
                dados_extras: { duracao_minutos: 30 }
            }]);
        
        // Marca como completa
        atividadeFisicaCompleta = true;
        atualizarEstadoWidgets();
        
        // Ativa brilho de saúde por 1 hora
        ativarBrilhoSaude();
        
        // Reseta timer
        const timerDiv = document.getElementById('atividade-fisica-timer');
        const inicioDiv = document.getElementById('atividade-fisica-inicio');
        const display = document.getElementById('atividade-timer-display');
        
        if (timerDiv) timerDiv.classList.add('hidden');
        if (inicioDiv) inicioDiv.classList.remove('hidden');
        if (display) display.textContent = '30:00';
        
        atividadeFisicaTempoRestante = 30 * 60;
        
        // Confetti
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#34d399']
            });
        }
    } catch (error) {
        console.error('Erro ao finalizar atividade:', error);
        alert('Erro ao salvar atividade. Tente novamente.');
    }
}

/**
 * Ativa o efeito visual "Brilho de Saúde" por 1 hora
 */
function ativarBrilhoSaude() {
    document.body.classList.add('brilho-saude');
    
    // Remove após 1 hora
    setTimeout(() => {
        document.body.classList.remove('brilho-saude');
    }, 60 * 60 * 1000); // 1 hora em milissegundos
    
    // Salva no localStorage para persistir
    localStorage.setItem('brilhoSaudeAtivo', 'true');
    localStorage.setItem('brilhoSaudeExpira', (Date.now() + 60 * 60 * 1000).toString());
}

/**
 * Verifica se o brilho de saúde ainda está ativo
 */
function verificarBrilhoSaude() {
    const expira = localStorage.getItem('brilhoSaudeExpira');
    if (expira && Date.now() < parseInt(expira)) {
        document.body.classList.add('brilho-saude');
    } else {
        document.body.classList.remove('brilho-saude');
        localStorage.removeItem('brilhoSaudeAtivo');
        localStorage.removeItem('brilhoSaudeExpira');
    }
}

/**
 * Registra evolução de biometria no Supabase
 */
async function registrarEvolucaoBiometria() {
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        alert('Erro: usuário não autenticado');
        return;
    }
    
    const peso = parseFloat(document.getElementById('biometriaPeso')?.value);
    const gordura = parseFloat(document.getElementById('biometriaGordura')?.value);
    const massaMagra = parseFloat(document.getElementById('biometriaMassaMagra')?.value);
    // Nota: circunferencia_abdominal não existe no schema atual do Supabase
    // const circunferencia = parseFloat(document.getElementById('biometriaCircunferencia')?.value) || null;
    
    if (!peso || !gordura || !massaMagra) {
        alert('Por favor, preencha Peso, Gordura e Massa Magra');
        return;
    }
    
    try {
        // Salva no Supabase na tabela historico_corpo
        // Nota: data_registro usa DEFAULT NOW() do Supabase, então não precisa enviar
        const { error } = await client
            .from('historico_corpo')
            .insert([{
                user_id: window.currentUser.id,
                peso: peso,
                percentual_gordura: gordura,
                massa_magra: massaMagra
                // circunferencia_abdominal não existe no schema atual
                // data_registro usa DEFAULT NOW() do Supabase
            }]);
        
        if (error) {
            console.error('Erro ao salvar biometria:', error);
            alert('Erro ao salvar biometria. Tente novamente.');
            return;
        }
        
        // Limpa campos
        document.getElementById('biometriaPeso').value = '';
        document.getElementById('biometriaGordura').value = '';
        document.getElementById('biometriaMassaMagra').value = '';
        if (document.getElementById('biometriaCircunferencia')) {
            document.getElementById('biometriaCircunferencia').value = '';
        }
        
        // Confetti
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#34d399']
            });
        }
        
        // Atualiza última data de registro para Quest Semanal
        localStorage.setItem('ultimaBiometriaData', getLocalDateString());
        
        // Esconde card de Quest Semanal se estiver visível
        const questCard = document.getElementById('quest-biometria-semanal');
        if (questCard) {
            questCard.classList.add('hidden');
        }
        
        alert('✅ Biometria registrada com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar biometria:', error);
        alert('Erro ao registrar biometria. Tente novamente.');
    }
}

/**
 * Abre o painel de biometria para registrar medida avulsa
 */
function registrarMedidaAvulsa() {
    // Navega para a página de perfil se não estiver lá
    if (window.navigationSystem) {
        window.navigationSystem.navigateTo('profile');
    }
    
    // Foca no primeiro campo após um pequeno delay
    setTimeout(() => {
        const pesoInput = document.getElementById('biometriaPeso');
        if (pesoInput) {
            pesoInput.focus();
            pesoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 300);
}

// ============================================
// SISTEMA DE CONFIGURAÇÕES DE NOTIFICAÇÕES
// ============================================

let configsNotificacao = {
    cafe: '08:00',
    almoco: '12:30',
    jantar: '20:00'
};

// Flag para saber se a coluna configs_notificacao existe no Supabase
let configsNotificacaoColumnExists = null;

/**
 * Carrega configurações de notificação do Supabase ou localStorage
 */
async function carregarConfigsNotificacao() {
    const client = getSupabaseClient();
    
    // Primeiro tenta carregar do localStorage (fallback rápido)
    const savedConfigs = localStorage.getItem('configs_notificacao');
    if (savedConfigs) {
        try {
            const parsed = JSON.parse(savedConfigs);
            configsNotificacao = { ...configsNotificacao, ...parsed };
            atualizarCamposConfigsNotificacao();
        } catch (e) {
            console.warn('Erro ao parsear configs do localStorage:', e);
        }
    }
    
    // Se já sabemos que a coluna não existe, não tenta buscar do Supabase
    if (configsNotificacaoColumnExists === false) {
        return;
    }
    
    // Tenta carregar do Supabase se disponível
    if (!client || !window.currentUser?.id) {
        return;
    }
    
    try {
        const { data, error } = await client
            .from('profiles')
            .select('configs_notificacao')
            .eq('id', window.currentUser.id)
            .single();
        
        // Se a coluna não existe (código 42703 ou erro 400), marca flag e usa apenas localStorage
        if (error) {
            // Verifica se é erro de coluna não existir
            const isColumnNotExists = 
                error.code === '42703' || 
                (error.message && (
                    error.message.includes('does not exist') || 
                    error.message.includes('column') && error.message.includes('not exist')
                )) ||
                (error.details && error.details.includes('does not exist'));
            
            if (isColumnNotExists) {
                // Coluna não existe - marca flag e usa apenas localStorage
                configsNotificacaoColumnExists = false;
                console.log('%cℹ️ Coluna configs_notificacao não existe, usando localStorage', 'color: #f59e0b;');
                return;
            }
            
            if (error.code !== 'PGRST116') { // PGRST116 = não encontrado
                console.warn('Erro ao carregar configs_notificacao:', error);
                return;
            }
        }
        
        // Se chegou aqui, a coluna existe
        configsNotificacaoColumnExists = true;
        
        if (data && data.configs_notificacao) {
            configsNotificacao = { ...configsNotificacao, ...data.configs_notificacao };
            // Salva no localStorage também
            localStorage.setItem('configs_notificacao', JSON.stringify(configsNotificacao));
        }
        
        // Atualiza campos no modal de configurações se existir
        atualizarCamposConfigsNotificacao();
    } catch (error) {
        // Se for erro de rede ou 400, assume que coluna não existe
        const isColumnNotExists = 
            (error.message && (
                error.message.includes('does not exist') || 
                error.message.includes('400') ||
                error.message.includes('column') && error.message.includes('not exist')
            )) ||
            (error.details && error.details.includes('does not exist'));
        
        if (isColumnNotExists) {
            configsNotificacaoColumnExists = false;
            console.log('%cℹ️ Coluna configs_notificacao não existe, usando localStorage', 'color: #f59e0b;');
        } else {
            console.warn('Erro ao carregar configurações de notificação:', error);
        }
    }
}

/**
 * Salva configurações de notificação no Supabase e localStorage
 */
async function salvarConfigsNotificacao() {
    const client = getSupabaseClient();
    if (!window.currentUser?.id) {
        alert('Erro: usuário não autenticado');
        return;
    }
    
    const cafeInput = document.getElementById('config-cafe-horario');
    const almocoInput = document.getElementById('config-almoco-horario');
    const jantarInput = document.getElementById('config-jantar-horario');
    
    if (!cafeInput || !almocoInput || !jantarInput) {
        return;
    }
    
    configsNotificacao = {
        cafe: cafeInput.value || '08:00',
        almoco: almocoInput.value || '12:30',
        jantar: jantarInput.value || '20:00'
    };
    
    // Sempre salva no localStorage primeiro (funciona mesmo sem Supabase)
    localStorage.setItem('configs_notificacao', JSON.stringify(configsNotificacao));
    
    // Tenta salvar no Supabase se disponível e se a coluna existe
    if (client && configsNotificacaoColumnExists !== false) {
        try {
            const { error } = await client
                .from('profiles')
                .update({ 
                    configs_notificacao: configsNotificacao,
                    updated_at: new Date().toISOString()
                })
                .eq('id', window.currentUser.id);
            
            if (error) {
                // Se a coluna não existe (código 42703), marca flag e apenas usa localStorage
                if (error.code === '42703' || (error.message && error.message.includes('does not exist'))) {
                    configsNotificacaoColumnExists = false;
                    console.log('%cℹ️ Coluna configs_notificacao não existe, usando apenas localStorage', 'color: #f59e0b;');
                } else {
                    console.warn('Erro ao salvar configs_notificacao no Supabase:', error);
                    // Continua mesmo com erro - já salvou no localStorage
                }
            } else {
                configsNotificacaoColumnExists = true;
                console.log('%c⚙️ Configurações de notificação salvas no Supabase', 'color: #3b82f6; font-weight: bold;');
            }
        } catch (error) {
            // Se for erro 400 ou de coluna não existir, marca flag
            if (error.message && (error.message.includes('does not exist') || error.message.includes('400'))) {
                configsNotificacaoColumnExists = false;
                console.log('%cℹ️ Coluna configs_notificacao não existe, usando localStorage', 'color: #f59e0b;');
            } else {
                console.warn('Erro ao salvar no Supabase (usando localStorage):', error);
            }
            // Continua mesmo com erro - já salvou no localStorage
        }
    }
    
    console.log('%c⚙️ Configurações de notificação salvas (localStorage)', 'color: #3b82f6; font-weight: bold;');
    
    // Fecha modal
    const modal = document.getElementById('configsNotificacaoModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    // Reinicia verificação de aura
    iniciarVerificacaoAuraRefeicao();
}

/**
 * Atualiza campos do modal de configurações
 */
function atualizarCamposConfigsNotificacao() {
    const cafeInput = document.getElementById('config-cafe-horario');
    const almocoInput = document.getElementById('config-almoco-horario');
    const jantarInput = document.getElementById('config-jantar-horario');
    
    if (cafeInput) cafeInput.value = configsNotificacao.cafe;
    if (almocoInput) almocoInput.value = configsNotificacao.almoco;
    if (jantarInput) jantarInput.value = configsNotificacao.jantar;
}

/**
 * Abre modal de configurações de notificação
 */
function abrirConfigsNotificacao() {
    const modal = document.getElementById('configsNotificacaoModal');
    if (modal) {
        atualizarCamposConfigsNotificacao();
        modal.classList.remove('hidden');
    }
}

/**
 * Fecha modal de configurações de notificação
 */
function fecharConfigsNotificacao() {
    const modal = document.getElementById('configsNotificacaoModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============================================
// QUEST SEMANAL DE BIOMETRIA
// ============================================

let questBiometriaInterval = null;

/**
 * Verifica se deve mostrar Quest Semanal de Biometria
 */
function verificarQuestBiometriaSemanal() {
    const ultimaData = localStorage.getItem('ultimaBiometriaData');
    const hoje = getLocalDateString();
    
    if (!ultimaData) {
        // Primeira vez - mostra o card
        mostrarQuestBiometriaSemanal();
        return;
    }
    
    const ultimaDataObj = new Date(ultimaData);
    const hojeObj = new Date(hoje);
    const diffDias = Math.floor((hojeObj - ultimaDataObj) / (1000 * 60 * 60 * 24));
    
    if (diffDias >= 7) {
        mostrarQuestBiometriaSemanal();
    } else {
        esconderQuestBiometriaSemanal();
    }
}

/**
 * Mostra card de Quest Semanal de Biometria
 */
function mostrarQuestBiometriaSemanal() {
    const questCard = document.getElementById('quest-biometria-semanal');
    if (questCard) {
        questCard.classList.remove('hidden');
    }
}

/**
 * Esconde card de Quest Semanal de Biometria
 */
function esconderQuestBiometriaSemanal() {
    const questCard = document.getElementById('quest-biometria-semanal');
    if (questCard) {
        questCard.classList.add('hidden');
    }
}

// ============================================
// AURA DE REFEIÇÃO
// ============================================

let auraRefeicaoInterval = null;
let auraRefeicaoAtiva = false;

/**
 * Inicia verificação de aura de refeição
 */
function iniciarVerificacaoAuraRefeicao() {
    // Limpa intervalo anterior
    if (auraRefeicaoInterval) {
        clearInterval(auraRefeicaoInterval);
    }
    
    // Verifica a cada minuto
    auraRefeicaoInterval = setInterval(() => {
        verificarAuraRefeicao();
    }, 60000); // 1 minuto
    
    // Verifica imediatamente
    verificarAuraRefeicao();
}

/**
 * Verifica se deve ativar aura de refeição
 */
function verificarAuraRefeicao() {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes(); // minutos desde meia-noite
    const horaFormatada = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    
    // Verifica cada tipo de refeição
    const tipos = ['cafe', 'almoco', 'jantar'];
    let auraAtiva = false;
    let corAura = '';
    let tipoRefeicao = '';
    
    tipos.forEach(tipo => {
        const horarioConfig = configsNotificacao[tipo];
        if (!horarioConfig) return;
        
        const [hora, minuto] = horarioConfig.split(':').map(Number);
        const horaConfig = hora * 60 + minuto;
        
        // Verifica se está no horário (com margem de 5 minutos antes e 30 minutos depois)
        if (horaAtual >= horaConfig - 5 && horaAtual <= horaConfig + 30) {
            // Verifica se a refeição não foi marcada
            if (!refeicoesMarcadas[tipo]) {
                auraAtiva = true;
                tipoRefeicao = tipo;
                
                if (tipo === 'almoco') {
                    corAura = 'verde';
                } else if (tipo === 'jantar') {
                    corAura = 'laranja';
                } else if (tipo === 'cafe') {
                    corAura = 'amarelo';
                }
            }
        }
    });
    
    if (auraAtiva && !auraRefeicaoAtiva) {
        ativarAuraRefeicao(corAura, tipoRefeicao);
    } else if (!auraAtiva && auraRefeicaoAtiva) {
        desativarAuraRefeicao();
    }
}

/**
 * Ativa aura de refeição
 */
function ativarAuraRefeicao(cor, tipo) {
    auraRefeicaoAtiva = true;
    const body = document.body;
    
    // Remove classes anteriores
    body.classList.remove('aura-refeicao-verde', 'aura-refeicao-laranja', 'aura-refeicao-amarelo');
    
    // Adiciona classe correspondente
    if (cor === 'verde') {
        body.classList.add('aura-refeicao-verde');
    } else if (cor === 'laranja') {
        body.classList.add('aura-refeicao-laranja');
    } else if (cor === 'amarelo') {
        body.classList.add('aura-refeicao-amarelo');
    }
}

/**
 * Desativa aura de refeição
 */
function desativarAuraRefeicao() {
    auraRefeicaoAtiva = false;
    const body = document.body;
    body.classList.remove('aura-refeicao-verde', 'aura-refeicao-laranja', 'aura-refeicao-amarelo');
}

// ============================================
// SISTEMA DE MEDICAMENTOS E NOTIFICAÇÕES
// ============================================

let medicamentos = [];
let horariosMedicamentos = {}; // { medicamentoId: [horarios] }
let medicamentoEditando = null;
let horarioCounter = 0;

// Verifica se Capacitor está disponível
let capacitorAvailable = false;
let LocalNotifications = null;

// Tenta carregar Capacitor (assíncrono)
async function inicializarCapacitor() {
    if (typeof window !== 'undefined' && window.Capacitor) {
        try {
            const { LocalNotifications: LocalNotificationsPlugin } = await import('@capacitor/local-notifications');
            LocalNotifications = LocalNotificationsPlugin;
            capacitorAvailable = true;
            console.log('%c✅ Capacitor LocalNotifications carregado', 'color: #10b981; font-weight: bold;');
            
            // Configura listeners após carregar
            await configurarListenersNotificacoes();
        } catch (error) {
            console.warn('Capacitor não disponível, usando fallback:', error);
        }
    }
}

/**
 * Solicita permissão para notificações
 */
async function solicitarPermissaoNotificacoes() {
    if (!capacitorAvailable || !LocalNotifications) {
        // Fallback: usa Notification API do navegador
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        return;
    }
    
    try {
        const result = await LocalNotifications.requestPermissions();
        if (result.display === 'granted') {
            console.log('%c✅ Permissão de notificações concedida', 'color: #10b981; font-weight: bold;');
        }
    } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
    }
}

/**
 * Abre modal de cadastro de medicamento
 */
function abrirModalMedicamento() {
    medicamentoEditando = null;
    document.getElementById('medicamentoNome').value = '';
    document.getElementById('medicamentoDose').value = '';
    document.getElementById('medicamentoHorario').value = '';
    document.getElementById('medicamentoEstoque').value = '';
    document.getElementById('medicamentoModal').classList.remove('hidden');
    
    // Solicita permissão ao abrir
    solicitarPermissaoNotificacoes();
}

/**
 * Fecha modal de medicamento
 */
function fecharModalMedicamento() {
    document.getElementById('medicamentoModal').classList.add('hidden');
    medicamentoEditando = null;
}

/**
 * Adiciona campo de horário ao formulário
 */
function adicionarHorario() {
    const container = document.getElementById('horariosContainer');
    const horarioId = `horario-${horarioCounter++}`;
    
    const horarioDiv = document.createElement('div');
    horarioDiv.className = 'flex gap-2 items-center';
    horarioDiv.innerHTML = `
        <input 
            type="time" 
            id="${horarioId}"
            class="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
        />
        <button 
            type="button" 
            onclick="this.parentElement.remove()" 
            class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
        >
            ✕
        </button>
    `;
    
    container.appendChild(horarioDiv);
}

/**
 * Salva medicamento no Supabase e agenda notificações
 */
async function salvarMedicamento(event) {
    if (event) event.preventDefault();
    
    const nome = document.getElementById('medicamentoNome').value.trim();
    const dosagem = document.getElementById('medicamentoDose').value.trim();
    const horario = document.getElementById('medicamentoHorario').value;
    const estoque = parseInt(document.getElementById('medicamentoEstoque').value, 10) || 0;
    
    if (!nome || !horario) {
        alert('Preencha Nome e Horário');
        return;
    }
    
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        alert('Erro: usuário não autenticado');
        return;
    }
    
    try {
        let medicamentoId;
        
        if (medicamentoEditando) {
            // Atualiza medicamento existente
            const { error } = await client
                .from('alquimia_medicamentos')
                .update({
                    nome: nome,
                    dosagem: dosagem || null,
                    horario: horario,
                    estoque: estoque
                })
                .eq('id', medicamentoEditando.id)
                .eq('user_id', window.currentUser.id);
            
            if (error) throw error;
            medicamentoId = medicamentoEditando.id;
        } else {
            // Cria novo medicamento
            const { data, error } = await client
                .from('alquimia_medicamentos')
                .insert([{
                    user_id: window.currentUser.id,
                    nome: nome,
                    dosagem: dosagem || null,
                    horario: horario,
                    estoque: estoque,
                    tomado_hoje: false
                }])
                .select()
                .single();
            
            if (error) throw error;
            medicamentoId = data.id;
        }
        
        // Agenda notificações
        await agendarNotificacaoMedicamento(medicamentoId, nome, dosagem, horario);
        
        // Recarrega lista
        await carregarMedicamentos();
        
        // Fecha modal
        fecharModalMedicamento();
        
        alert('✅ Medicamento salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar medicamento:', error);
        alert('Erro ao salvar medicamento. Tente novamente.');
    }
}

/**
 * Cancela notificações de forma segura (evita crash no Android)
 */
async function cancelarNotificacaoSegura(notificationId) {
    if (!capacitorAvailable || !LocalNotifications) {
        return;
    }
    
    // Valida se o ID é um número inteiro válido
    const id = parseInt(notificationId, 10);
    if (isNaN(id) || id <= 0) {
        console.warn('⚠️ ID de notificação inválido:', notificationId);
        return;
    }
    
    try {
        // Obtém notificações pendentes primeiro
        const pendentes = await LocalNotifications.getPending();
        
        if (pendentes && pendentes.notifications && pendentes.notifications.length > 0) {
            // Verifica se a notificação existe antes de cancelar
            const existe = pendentes.notifications.some(n => n.id === id);
            
            if (existe) {
                await LocalNotifications.cancel({ notifications: [id] });
                console.log('✅ Notificação cancelada:', id);
            } else {
                console.log('ℹ️ Notificação não encontrada nas pendentes:', id);
            }
        } else {
            console.log('ℹ️ Nenhuma notificação pendente para cancelar');
        }
    } catch (error) {
        console.error('❌ Erro ao cancelar notificação:', error);
        // Não lança erro para evitar crash
    }
}

/**
 * Gera um ID de notificação válido a partir de um medicamentoId
 * Usa apenas os últimos 6 dígitos numéricos do UUID ou timestamp
 */
function gerarNotificationId(medicamentoId) {
    if (!medicamentoId) {
        console.error('❌ medicamentoId não fornecido');
        return null;
    }
    
    // Extrai apenas os dígitos numéricos do UUID
    const digitos = String(medicamentoId).replace(/[^0-9]/g, '');
    
    if (digitos.length >= 6) {
        // Usa os últimos 6 dígitos numéricos
        const id = parseInt(digitos.slice(-6), 10);
        if (!isNaN(id) && id > 0) {
            return id;
        }
    }
    
    // Fallback: usa timestamp (últimos 6 dígitos)
    const timestamp = Math.floor(Date.now() / 1000);
    const idFallback = parseInt(String(timestamp).slice(-6), 10);
    
    if (!isNaN(idFallback) && idFallback > 0) {
        console.log('✅ ID gerado via timestamp:', idFallback);
        return idFallback;
    }
    
    // Último fallback: hash simples limitado a 6 dígitos
    let hash = 0;
    const str = String(medicamentoId);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    const finalId = Math.abs(hash) % 999999; // Limita a 6 dígitos
    console.log('✅ ID gerado via hash:', finalId);
    return finalId;
}

/**
 * Agenda notificação para um medicamento
 */
async function agendarNotificacaoMedicamento(medicamentoId, nome, dosagem, horario) {
    // Verifica se Capacitor está disponível
    if (!capacitorAvailable || !LocalNotifications) {
        console.warn('⚠️ Capacitor não disponível, notificações não serão agendadas');
        return;
    }
    
    // Garante que as permissões foram solicitadas antes de agendar o primeiro alerta
    try {
        const { LocalNotifications: LocalNotificationsPlugin } = await import('@capacitor/local-notifications');
        const result = await LocalNotificationsPlugin.requestPermissions();
        if (result.display !== 'granted') {
            console.warn('⚠️ Permissão de notificação não concedida');
            alert('⚠️ Permissão de notificação necessária para alertas de medicamentos');
            return;
        }
    } catch (permError) {
        console.error('❌ Erro ao solicitar permissão:', permError);
        // Continua mesmo assim, pode já ter permissão
    }
    
    try {
        // Gera ID de notificação válido
        const notificationId = gerarNotificationId(medicamentoId);
        if (!notificationId) {
            console.error('❌ Não foi possível gerar ID de notificação válido');
            return;
        }
        
        // Cancela notificações antigas deste medicamento de forma segura
        await cancelarNotificacaoSegura(notificationId);
        
        // Calcula data da notificação
        const [hora, minuto] = horario.split(':').map(Number);
        const hoje = new Date();
        const dataNotificacao = new Date();
        dataNotificacao.setHours(hora, minuto, 0, 0);
        
        // Se o horário já passou hoje, agenda para amanhã
        // Caso contrário, agenda para hoje (primeiro alerta)
        if (dataNotificacao < hoje) {
            dataNotificacao.setDate(dataNotificacao.getDate() + 1);
        }
        
        const bodyText = dosagem ? `${nome} (${dosagem}) - ${horario}` : `${nome} - ${horario}`;
        
        // Agenda o primeiro alerta e configura repetição diária
        await LocalNotifications.schedule({
            notifications: [{
                id: notificationId,
                title: '💊 Hora do Medicamento',
                body: bodyText,
                sound: 'default', // Som padrão de alarme do sistema
                schedule: {
                    at: dataNotificacao, // Primeiro alerta (hoje se ainda não passou, amanhã se já passou)
                    repeats: true,
                    every: 'day' // Repete diariamente
                },
                actionTypeId: 'MED_REMINDER',
                extra: {
                    medicamentoId: medicamentoId.toString(),
                    nome: nome,
                    dosagem: dosagem || '',
                    horario: horario
                }
            }]
        });
        
        console.log('%c✅ Primeiro alerta agendado para', 'color: #10b981; font-weight: bold;', nome, horario, 'em', dataNotificacao.toLocaleString('pt-BR'));
    } catch (error) {
        console.error('❌ Erro ao agendar notificação:', error);
        alert('Erro ao agendar notificação. Verifique as permissões.');
    }
}

/**
 * Reseta tomado_hoje diariamente
 */
async function verificarResetMedicamentosDiario() {
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) return;
    
    const ultimoReset = localStorage.getItem('ultimoResetMedicamentos');
    const hoje = getLocalDateString();
    
    if (ultimoReset !== hoje) {
        try {
            await client
                .from('alquimia_medicamentos')
                .update({ tomado_hoje: false })
                .eq('user_id', window.currentUser.id)
                .eq('tomado_hoje', true);
            
            localStorage.setItem('ultimoResetMedicamentos', hoje);
            await carregarMedicamentos();
        } catch (error) {
            console.error('Erro ao resetar medicamentos:', error);
        }
    }
}

/**
 * Carrega medicamentos do Supabase
 */
async function carregarMedicamentos() {
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        return;
    }
    
    try {
        const { data, error } = await client
            .from('alquimia_medicamentos')
            .select('*')
            .eq('user_id', window.currentUser.id)
            .order('horario', { ascending: true });
        
        if (error) throw error;
        
        medicamentos = data || [];
        renderizarMedicamentos();
        
        // Inicia verificação de horários
        iniciarVerificacaoHorariosMedicamentos();
    } catch (error) {
        console.error('Erro ao carregar medicamentos:', error);
        medicamentos = [];
        renderizarMedicamentos();
    }
}

/**
 * Renderiza lista de medicamentos
 */
function renderizarMedicamentos() {
    const container = document.getElementById('medicamentosList');
    const empty = document.getElementById('medicamentosEmpty');
    
    if (!container) return;
    
    if (medicamentos.length === 0) {
        if (empty) empty.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }
    
    if (empty) empty.classList.add('hidden');
    
    container.innerHTML = medicamentos.map(med => {
        const dosagemStr = med.dosagem ? ` (${med.dosagem})` : '';
        const tomadoClass = med.tomado_hoje ? 'tomado' : '';
        const tomadoBadge = med.tomado_hoje ? '<span class="text-xs bg-green-600 px-2 py-1 rounded">✓ Tomado</span>' : '';
        
        // Botão diferente se já está tomado (permite reverter)
        const botaoTomar = med.tomado_hoje 
            ? `<button onclick="tomarMedicamento('${med.id}')" class="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-semibold">↩️ Reverter</button>`
            : `<button onclick="tomarMedicamento('${med.id}')" class="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold">💊 Tomar</button>`;
        
        // Estilo de frasco de poção
        return `
            <div class="frasco-pocao ${tomadoClass}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="text-3xl">🧪</div>
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="font-semibold text-sm">${med.nome}${dosagemStr}</h3>
                                ${tomadoBadge}
                            </div>
                            <p class="text-xs text-gray-400">⏰ ${med.horario}</p>
                            <p class="text-xs text-gray-500">Estoque: ${med.estoque}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        ${botaoTomar}
                        <button onclick="editarMedicamento('${med.id}')" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold">Editar</button>
                        <button onclick="excluirMedicamento('${med.id}')" class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold">Excluir</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Edita medicamento
 */
async function editarMedicamento(id) {
    const medicamento = medicamentos.find(m => m.id === id);
    if (!medicamento) return;
    
    medicamentoEditando = medicamento;
    document.getElementById('medicamentoNome').value = medicamento.nome || '';
    document.getElementById('medicamentoDose').value = medicamento.dosagem || '';
    document.getElementById('medicamentoHorario').value = medicamento.horario || '';
    document.getElementById('medicamentoEstoque').value = medicamento.estoque || 0;
    
    document.getElementById('medicamentoModal').classList.remove('hidden');
}

/**
 * Exclui medicamento
 */
async function excluirMedicamento(id) {
    if (!confirm('Tem certeza que deseja excluir este medicamento?')) return;
    
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        alert('Erro: usuário não autenticado');
        return;
    }
    
    try {
        // Cancela notificações de forma segura
        if (capacitorAvailable && LocalNotifications) {
            const notificationId = gerarNotificationId(id);
            if (notificationId) {
                await cancelarNotificacaoSegura(notificationId);
            }
        }
        
        // Remove do Supabase
        const { error } = await client
            .from('alquimia_medicamentos')
            .delete()
            .eq('id', id)
            .eq('user_id', window.currentUser.id);
        
        if (error) throw error;
        
        await carregarMedicamentos();
        alert('✅ Medicamento excluído');
    } catch (error) {
        console.error('Erro ao excluir medicamento:', error);
        alert('Erro ao excluir medicamento. Tente novamente.');
    }
}

/**
 * Cancela todas as notificações pendentes de um medicamento
 */
async function cancelarTodasNotificacoesMedicamento(medicamentoId) {
    if (!capacitorAvailable || !LocalNotifications) {
        return;
    }
    
    try {
        // Obtém todas as notificações pendentes
        const pendentes = await LocalNotifications.getPending();
        
        if (pendentes && pendentes.notifications && pendentes.notifications.length > 0) {
            // Filtra notificações relacionadas a este medicamento
            const idsParaCancelar = [];
            
            pendentes.notifications.forEach(notif => {
                const extra = notif.extra || {};
                if (extra.medicamentoId && String(extra.medicamentoId) === String(medicamentoId)) {
                    idsParaCancelar.push(notif.id);
                }
            });
            
            // Cancela todas as notificações encontradas
            if (idsParaCancelar.length > 0) {
                await LocalNotifications.cancel({ notifications: idsParaCancelar });
                console.log(`✅ ${idsParaCancelar.length} notificação(ões) cancelada(s) para medicamento:`, medicamentoId);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao cancelar notificações do medicamento:', error);
        // Não lança erro para evitar crash
    }
}

/**
 * Reverte o status de tomado (desmarca como tomado)
 */
async function reverterTomarMedicamento(medicamentoId) {
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        alert('Erro: usuário não autenticado');
        return;
    }
    
    try {
        const medicamento = medicamentos.find(m => m.id === medicamentoId);
        if (!medicamento) {
            alert('Medicamento não encontrado');
            return;
        }
        
        // Reverte o status no Supabase
        await client
            .from('alquimia_medicamentos')
            .update({ 
                tomado_hoje: false,
                ultima_dose: null
            })
            .eq('id', medicamentoId)
            .eq('user_id', window.currentUser.id);
        
        // Remove a atividade relacionada (se existir)
        const hoje = getLocalDateString();
        await client
            .from('atividades')
            .delete()
            .eq('user_id', window.currentUser.id)
            .eq('nome_tarefa', `Medicamento: ${medicamento.nome}`)
            .eq('data_completada', hoje);
        
        // Remove XP (se possível)
        if (window.pointsSystem) {
            window.pointsSystem.addPoints(-20); // Remove 20 XP
        }
        
        // Recarrega lista
        await carregarMedicamentos();
        
        alert('↩️ Status revertido. Você pode tomar o medicamento novamente.');
    } catch (error) {
        console.error('Erro ao reverter status do medicamento:', error);
        alert('Erro ao reverter status. Tente novamente.');
    }
}

/**
 * Toma medicamento (marca como tomado hoje)
 */
async function tomarMedicamento(medicamentoId) {
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        alert('Erro: usuário não autenticado');
        return;
    }
    
    try {
        const medicamento = medicamentos.find(m => m.id === medicamentoId);
        if (!medicamento) {
            alert('Medicamento não encontrado');
            return;
        }
        
        // Se já está tomado, reverte o status
        if (medicamento.tomado_hoje) {
            await reverterTomarMedicamento(medicamentoId);
            return;
        }
        
        // Cancela TODAS as notificações pendentes deste medicamento
        await cancelarTodasNotificacoesMedicamento(medicamentoId);
        
        const novoEstoque = Math.max(0, (medicamento.estoque || 0) - 1);
        const agora = new Date().toISOString();
        
        // Atualiza no Supabase
        await client
            .from('alquimia_medicamentos')
            .update({ 
                tomado_hoje: true,
                ultima_dose: agora,
                estoque: novoEstoque
            })
            .eq('id', medicamentoId)
            .eq('user_id', window.currentUser.id);
        
        // Adiciona +20 XP
        if (window.pointsSystem) {
            window.pointsSystem.addPoints(20);
        }
        
        // Salva atividade
        await client
            .from('atividades')
            .insert([{
                user_id: window.currentUser.id,
                nome_tarefa: `Medicamento: ${medicamento.nome}`,
                categoria: 'Saúde',
                data_completada: getLocalDateString(),
                progresso: 100,
                dados_extras: { tipo: 'medicamento', xp: 20 }
            }]);
        
        // Desativa borbulha e aura
        desativarBorbulhaFrasco();
        desativarAuraMedicamento();
        
        // Recarrega lista
        await carregarMedicamentos();
        
        // Confetti
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 30,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#10b981', '#34d399']
            });
        }
        
        alert('✅ Medicamento registrado!');
    } catch (error) {
        console.error('Erro ao tomar medicamento:', error);
        alert('Erro ao registrar medicamento. Tente novamente.');
    }
}

/**
 * Confirma ingestão de medicamento (chamado pela notificação)
 * Não permite reverter se chamado pela notificação
 */
async function confirmarIngestaoMedicamento(medicamentoId) {
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        return;
    }
    
    try {
        const medicamento = medicamentos.find(m => m.id === medicamentoId);
        if (!medicamento) {
            return;
        }
        
        // Se já está tomado, não faz nada (não reverte via notificação)
        if (medicamento.tomado_hoje) {
            console.log('ℹ️ Medicamento já foi tomado hoje');
            return;
        }
        
        // Chama a função normal de tomar (que cancela notificações)
        await tomarMedicamento(medicamentoId);
    } catch (error) {
        console.error('Erro ao confirmar ingestão:', error);
    }
}

/**
 * Adia notificação de medicamento em 30 minutos
 * Verifica se o medicamento já foi tomado antes de adiar
 */
async function adiarMedicamento30min(medicamentoId, nome, dosagem, horario) {
    // Verifica se o medicamento já foi tomado
    const medicamento = medicamentos.find(m => m.id === medicamentoId);
    if (medicamento && medicamento.tomado_hoje) {
        console.log('ℹ️ Medicamento já foi tomado, não será adiado');
        return;
    }
    
    if (!capacitorAvailable || !LocalNotifications) {
        // Fallback: usa setTimeout
        setTimeout(() => {
            // Verifica novamente antes de mostrar alerta
            const med = medicamentos.find(m => m.id === medicamentoId);
            if (med && med.tomado_hoje) {
                return; // Não mostra se já foi tomado
            }
            
            const frasco = document.getElementById('frascoAlquimia');
            if (frasco) {
                frasco.classList.add('frasco-borbulhando');
            }
            alert(`💊 Lembrete: ${nome}${dosagem ? ' (' + dosagem + ')' : ''} - ${horario}`);
        }, 30 * 60 * 1000);
        return;
    }
    
    try {
        // Verifica novamente antes de agendar
        const med = medicamentos.find(m => m.id === medicamentoId);
        if (med && med.tomado_hoje) {
            console.log('ℹ️ Medicamento já foi tomado, cancelando adiamento');
            return;
        }
        
        const agora = new Date();
        const novaData = new Date(agora.getTime() + 30 * 60 * 1000); // +30 minutos
        
        // Gera ID único para notificação adiada usando a função segura
        // Combina medicamentoId com timestamp para garantir unicidade
        const idComTimestamp = String(medicamentoId) + String(Date.now());
        let notificationId = gerarNotificationId(idComTimestamp);
        
        // Se ainda não conseguir, usa timestamp direto
        if (!notificationId) {
            notificationId = parseInt(String(Math.floor(Date.now() / 1000)).slice(-6), 10);
        }
        
        const bodyText = dosagem ? `${nome} (${dosagem}) - ${horario}` : `${nome} - ${horario}`;
        
        await LocalNotifications.schedule({
            notifications: [{
                id: notificationId,
                title: '💊 Hora do Medicamento',
                body: bodyText,
                sound: 'default', // Som padrão de alarme do sistema
                schedule: {
                    at: novaData
                },
                actionTypeId: 'MED_REMINDER',
                extra: {
                    medicamentoId: medicamentoId.toString(),
                    nome: nome,
                    dosagem: dosagem || '',
                    horario: horario
                }
            }]
        });
        
        console.log('%c⏰ Medicamento adiado por 30 minutos', 'color: #f59e0b; font-weight: bold;');
    } catch (error) {
        console.error('Erro ao adiar medicamento:', error);
    }
}

// ============================================
// VERIFICAÇÃO DE HORÁRIOS E BORBULHA
// ============================================

let verificacaoHorariosInterval = null;

/**
 * Inicia verificação de horários de medicamentos
 */
function iniciarVerificacaoHorariosMedicamentos() {
    if (verificacaoHorariosInterval) {
        clearInterval(verificacaoHorariosInterval);
    }
    
    // Verifica a cada minuto
    verificacaoHorariosInterval = setInterval(() => {
        verificarHorariosMedicamentos();
    }, 60000);
    
    // Verifica imediatamente
    verificarHorariosMedicamentos();
}

/**
 * Verifica se algum medicamento está no horário
 */
function verificarHorariosMedicamentos() {
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    const horaAtualStr = `${String(horaAtual).padStart(2, '0')}:${String(minutoAtual).padStart(2, '0')}`;
    
    let medicamentoNoHorario = null;
    
    medicamentos.forEach(med => {
        if (med.tomado_hoje) return; // Já foi tomado hoje
        
        const [horaMed, minutoMed] = med.horario.split(':').map(Number);
        const horaMedStr = `${String(horaMed).padStart(2, '0')}:${String(minutoMed).padStart(2, '0')}`;
        
        // Verifica se está no horário (com margem de 5 minutos antes e depois)
        if (horaMedStr === horaAtualStr || 
            (horaMed === horaAtual && Math.abs(minutoMed - minutoAtual) <= 5)) {
            medicamentoNoHorario = med;
        }
    });
    
    if (medicamentoNoHorario) {
        ativarBorbulhaFrasco();
        enviarNotificacaoMedicamento(medicamentoNoHorario);
    } else {
        desativarBorbulhaFrasco();
    }
}

/**
 * Ativa animação de borbulha no frasco
 */
function ativarBorbulhaFrasco() {
    const frasco = document.getElementById('frascoAlquimia');
    if (frasco) {
        frasco.classList.add('frasco-borbulhando');
    }
}

/**
 * Desativa animação de borbulha no frasco
 */
function desativarBorbulhaFrasco() {
    const frasco = document.getElementById('frascoAlquimia');
    if (frasco) {
        frasco.classList.remove('frasco-borbulhando');
    }
}

/**
 * Envia notificação nativa do medicamento
 */
async function enviarNotificacaoMedicamento(medicamento) {
    if (!capacitorAvailable || !LocalNotifications) {
        // Fallback: usa Notification API do navegador
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💊 Hora do Medicamento', {
                body: `${medicamento.nome}${medicamento.dosagem ? ' (' + medicamento.dosagem + ')' : ''} - ${medicamento.horario}`,
                icon: '/favicon.ico',
                tag: `med-${medicamento.id}`
            });
        }
        return;
    }
    
    try {
        // Gera ID de notificação válido
        const notificationId = gerarNotificationId(medicamento.id);
        if (!notificationId) {
            console.error('❌ Não foi possível gerar ID de notificação válido');
            return;
        }
        
        const bodyText = medicamento.dosagem ? 
            `${medicamento.nome} (${medicamento.dosagem}) - ${medicamento.horario}` : 
            `${medicamento.nome} - ${medicamento.horario}`;
        
        await LocalNotifications.schedule({
            notifications: [{
                id: notificationId,
                title: '💊 Hora do Medicamento',
                body: bodyText,
                sound: 'default', // Som padrão de alarme do sistema
                actionTypeId: 'MED_REMINDER',
                extra: {
                    medicamentoId: medicamento.id.toString(),
                    nome: medicamento.nome,
                    dosagem: medicamento.dosagem || '',
                    horario: medicamento.horario
                }
            }]
        });
    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
    }
}

// ============================================
// AURA DE ALERTA DE MEDICAMENTO
// ============================================

let auraMedicamentoInterval = null;
let auraMedicamentoAtiva = false;

/**
 * Inicia verificação de aura de medicamento
 */
function iniciarVerificacaoAuraMedicamento() {
    if (auraMedicamentoInterval) {
        clearInterval(auraMedicamentoInterval);
    }
    
    // Verifica a cada minuto
    auraMedicamentoInterval = setInterval(() => {
        verificarAuraMedicamento();
    }, 60000);
    
    // Verifica imediatamente
    verificarAuraMedicamento();
}

/**
 * Verifica se deve ativar aura de medicamento
 */
function verificarAuraMedicamento() {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();
    
    let medicamentoAtrasado = false;
    
    medicamentos.forEach(med => {
        if (!med.horarios || med.estoque <= 0) return;
        
        med.horarios.forEach(horario => {
            const [hora, minuto] = horario.split(':').map(Number);
            const horaMedicamento = hora * 60 + minuto;
            
            // Se passou do horário (com margem de 5 minutos) e não foi confirmado hoje
            if (horaAtual > horaMedicamento + 5) {
                // Verifica se foi confirmado hoje (pode ser melhorado com histórico)
                medicamentoAtrasado = true;
            }
        });
    });
    
    if (medicamentoAtrasado && !auraMedicamentoAtiva) {
        ativarAuraMedicamento();
    } else if (!medicamentoAtrasado && auraMedicamentoAtiva) {
        desativarAuraMedicamento();
    }
}

/**
 * Ativa aura de alerta de medicamento (Branca pulsante usando aura-escudo)
 */
function ativarAuraMedicamento() {
    if (auraMedicamentoAtiva) return; // Já está ativa
    
    auraMedicamentoAtiva = true;
    const aura = document.getElementById('aura-escudo');
    const body = document.body;
    
    if (aura) {
        aura.classList.add('aura-branca');
        aura.classList.remove('opacity-0');
        aura.style.opacity = '1';
    }
    
    body.classList.add('aura-medicamento-alerta');
    console.log('✅ Aura branca de medicamento ativada');
}

/**
 * Desativa aura de alerta de medicamento
 */
function desativarAuraMedicamento() {
    if (!auraMedicamentoAtiva) return; // Já está desativada
    
    auraMedicamentoAtiva = false;
    const aura = document.getElementById('aura-escudo');
    const body = document.body;
    
    if (aura) {
        aura.classList.remove('aura-branca');
        aura.style.opacity = '0';
    }
    
    body.classList.remove('aura-medicamento-alerta');
    console.log('✅ Aura branca de medicamento desativada');
}

/**
 * Configura listeners de notificações do Capacitor
 */
async function configurarListenersNotificacoes() {
    if (!capacitorAvailable || !LocalNotifications) return;
    
    try {
        // Define actionTypeId MED_REMINDER com botões
        await LocalNotifications.registerActionTypes({
            types: [
                {
                    id: 'MED_REMINDER',
                    actions: [
                        {
                            id: 'CONFIRMAR_INGESTAO',
                            title: 'Confirmar Ingestão',
                            foreground: true
                        },
                        {
                            id: 'ADIAR_30MIN',
                            title: 'Adiar 30 min',
                            foreground: false
                        }
                    ]
                }
            ]
        });
        
        await LocalNotifications.addListener('actionPerformed', (notification) => {
            const actionId = notification.actionId;
            const extra = notification.notification.extra || {};
            const medicamentoId = extra.medicamentoId;
            const nome = extra.nome || '';
            const dosagem = extra.dosagem || '';
            const horario = extra.horario || '';
            
            if (actionId === 'CONFIRMAR_INGESTAO') {
                confirmarIngestaoMedicamento(medicamentoId);
            } else if (actionId === 'ADIAR_30MIN') {
                adiarMedicamento30min(medicamentoId, nome, dosagem, horario);
            }
        });
        
        console.log('%c✅ Listeners de notificações configurados', 'color: #10b981; font-weight: bold;');
    } catch (error) {
        console.error('Erro ao configurar listeners:', error);
    }
}

// ============================================
// SISTEMA DE TEMA RPG
// ============================================

/**
 * Carrega preferência de tema do Supabase
 */
async function carregarTemaRPG() {
    const client = getSupabaseClient();
    if (!client || !window.currentUser?.id) {
        // Fallback para localStorage
        const temaSalvo = localStorage.getItem('temaRPG');
        if (temaSalvo === 'true') {
            aplicarTemaRPG(true);
        }
        return;
    }
    
    try {
        const { data, error } = await client
            .from('profiles')
            .select('tema_rpg')
            .eq('id', window.currentUser.id)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = nenhuma linha retornada
            console.warn('Erro ao carregar tema:', error);
            // Fallback para localStorage
            const temaSalvo = localStorage.getItem('temaRPG');
            if (temaSalvo === 'true') {
                aplicarTemaRPG(true);
            }
            return;
        }
        
        const temaAtivo = data?.tema_rpg === true || localStorage.getItem('temaRPG') === 'true';
        aplicarTemaRPG(temaAtivo);
    } catch (error) {
        console.error('Erro ao carregar tema:', error);
        const temaSalvo = localStorage.getItem('temaRPG');
        if (temaSalvo === 'true') {
            aplicarTemaRPG(true);
        }
    }
}

/**
 * Salva preferência de tema no Supabase
 */
async function salvarTemaRPG(temaAtivo) {
    const client = getSupabaseClient();
    
    // Salva em localStorage como fallback
    localStorage.setItem('temaRPG', temaAtivo ? 'true' : 'false');
    
    if (!client || !window.currentUser?.id) {
        return;
    }
    
    try {
        const { error } = await client
            .from('profiles')
            .update({ tema_rpg: temaAtivo })
            .eq('id', window.currentUser.id);
        
        if (error) {
            console.warn('Erro ao salvar tema no Supabase:', error);
        }
    } catch (error) {
        console.error('Erro ao salvar tema:', error);
    }
}

/**
 * Aplica o tema visual
 */
function aplicarTema(tema) {
    const body = document.body;
    const main = document.querySelector('main');
    
    if (tema === 'rpg') {
        body.classList.add('tema-rpg');
        if (main) main.classList.add('bg-[#000000]');
    } else {
        body.classList.remove('tema-rpg');
        if (main) main.classList.remove('bg-[#000000]');
    }
}

/**
 * Alterna entre Tema Moderno e Tema RPG
 */
async function alternarTema(tema) {
    aplicarTema(tema);
    
    // Salva no localStorage imediatamente
    localStorage.setItem('temaAtual', tema);
    
    // Atualiza texto
    const temaAtualTexto = document.getElementById('temaAtualTexto');
    if (temaAtualTexto) {
        temaAtualTexto.textContent = tema === 'rpg' ? 'Tema RPG ativo' : 'Tema Moderno ativo';
    }
    
    // Tenta salvar no Supabase (não bloqueia se falhar)
    const client = getSupabaseClient();
    if (client && window.currentUser?.id) {
        try {
            await client
                .from('profiles')
                .update({ tema_rpg: tema === 'rpg' })
                .eq('id', window.currentUser.id);
        } catch (error) {
            console.warn('Erro ao salvar tema no Supabase:', error);
        }
    }
    
    // Atualiza barras e atributos após mudança de tema
    atualizarBarrasStatusRPG();
    atualizarAtributosManutencao();
}

/**
 * Aplica ou remove tema RPG (compatibilidade)
 */
function aplicarTemaRPG(ativo) {
    aplicarTema(ativo ? 'rpg' : 'moderno');
}

/**
 * Alterna tema RPG (compatibilidade)
 */
async function alternarTemaRPG() {
    const toggle = document.getElementById('temaRpgToggle');
    if (toggle) {
        const temaAtivo = toggle.checked;
        await alternarTema(temaAtivo ? 'rpg' : 'moderno');
    } else {
        // Se não encontrar toggle antigo, alterna baseado no estado atual
        const temaAtual = localStorage.getItem('temaAtual') || 'moderno';
        const novoTema = temaAtual === 'rpg' ? 'moderno' : 'rpg';
        await alternarTema(novoTema);
    }
}

// Expor funções globalmente
window.abrirModalMedicamento = abrirModalMedicamento;
window.fecharModalMedicamento = fecharModalMedicamento;
window.adicionarHorario = adicionarHorario;
window.salvarMedicamento = salvarMedicamento;
window.editarMedicamento = editarMedicamento;
window.excluirMedicamento = excluirMedicamento;
window.confirmarIngestaoMedicamento = confirmarIngestaoMedicamento;
window.adiarMedicamento30min = adiarMedicamento30min;
window.tomarMedicamento = tomarMedicamento;
window.alternarTemaRPG = alternarTemaRPG;
window.alternarTema = alternarTema;
window.aplicarTema = aplicarTema;
window.aplicarTemaRPG = aplicarTemaRPG;

// Expor funções globalmente
window.registrarEvolucaoBiometria = registrarEvolucaoBiometria;
window.registrarMedidaAvulsa = registrarMedidaAvulsa;
window.abrirConfigsNotificacao = abrirConfigsNotificacao;
window.fecharConfigsNotificacao = fecharConfigsNotificacao;
window.salvarConfigsNotificacao = salvarConfigsNotificacao;
window.abrirTimerAtividadeFisica = abrirTimerAtividadeFisica;
window.iniciarAtividadeFisica = iniciarAtividadeFisica;
window.pausarAtividadeFisica = pausarAtividadeFisica;
window.finalizarAtividadeFisica = finalizarAtividadeFisica;

/**
 * Mostra/oculta abas do Dashboard
 */
function mostrarAbaDashboard(aba) {
    const abaSaude = document.getElementById('dashboard-saude');
    const abaAlquimia = document.getElementById('dashboard-alquimia');
    const tabSaude = document.getElementById('tab-saude');
    const tabAlquimia = document.getElementById('tab-alquimia');
    
    if (aba === 'saude') {
        if (abaSaude) abaSaude.classList.remove('hidden');
        if (abaAlquimia) abaAlquimia.classList.add('hidden');
        if (tabSaude) {
            tabSaude.classList.add('border-indigo-500', 'text-indigo-400');
            tabSaude.classList.remove('border-transparent', 'text-gray-400');
        }
        if (tabAlquimia) {
            tabAlquimia.classList.remove('border-indigo-500', 'text-indigo-400');
            tabAlquimia.classList.add('border-transparent', 'text-gray-400');
        }
    } else if (aba === 'alquimia') {
        if (abaSaude) abaSaude.classList.add('hidden');
        if (abaAlquimia) abaAlquimia.classList.remove('hidden');
        if (tabSaude) {
            tabSaude.classList.remove('border-indigo-500', 'text-indigo-400');
            tabSaude.classList.add('border-transparent', 'text-gray-400');
        }
        if (tabAlquimia) {
            tabAlquimia.classList.add('border-indigo-500', 'text-indigo-400');
            tabAlquimia.classList.remove('border-transparent', 'text-gray-400');
        }
    }
}

/**
 * Atualiza as barras de Status RPG (HP e Mana)
 */
function atualizarBarrasStatusRPG() {
    // Calcula HP baseado em refeições (0-3 refeições = 0-100%)
    const refeicoesCompletas = Object.values(refeicoesMarcadas).filter(r => r === true).length;
    const hpPercent = Math.round((refeicoesCompletas / 3) * 100);
    
    const hpBar = document.getElementById('hp-bar-fill');
    const hpPercentEl = document.getElementById('hp-percent');
    if (hpBar) {
        hpBar.style.width = `${hpPercent}%`;
    }
    if (hpPercentEl) {
        hpPercentEl.textContent = `${hpPercent}%`;
    }
    
    // Calcula Mana baseado em água (0-2000ml = 0-100%)
    const manaPercent = Math.min(100, Math.round((waterAmount / waterTarget) * 100));
    
    const manaBar = document.getElementById('mana-bar-fill');
    const manaPercentEl = document.getElementById('mana-percent');
    if (manaBar) {
        manaBar.style.width = `${manaPercent}%`;
    }
    if (manaPercentEl) {
        manaPercentEl.textContent = `${manaPercent}%`;
    }
}

/**
 * Atualiza os atributos de manutenção (ícones que brilham quando completados)
 */
function atualizarAtributosManutencao() {
    // Água
    const atributoAgua = document.getElementById('atributo-agua');
    if (atributoAgua) {
        const aguaPercent = Math.min(100, Math.round((waterAmount / waterTarget) * 100));
        if (aguaPercent >= 100) {
            atributoAgua.classList.add('completo');
        } else {
            atributoAgua.classList.remove('completo');
        }
    }
    
    // Refeições
    const atributoCafe = document.getElementById('atributo-cafe');
    const atributoAlmoco = document.getElementById('atributo-almoco');
    const atributoJantar = document.getElementById('atributo-jantar');
    
    if (atributoCafe) {
        if (refeicoesMarcadas.cafe) {
            atributoCafe.classList.add('completo');
        } else {
            atributoCafe.classList.remove('completo');
        }
    }
    
    if (atributoAlmoco) {
        if (refeicoesMarcadas.almoco) {
            atributoAlmoco.classList.add('completo');
        } else {
            atributoAlmoco.classList.remove('completo');
        }
    }
    
    if (atributoJantar) {
        if (refeicoesMarcadas.jantar) {
            atributoJantar.classList.add('completo');
        } else {
            atributoJantar.classList.remove('completo');
        }
    }
    
    // Treino e Limpeza (verificar se há timers ativos ou completados hoje)
    const atributoTreino = document.getElementById('atributo-treino');
    const atributoLimpeza = document.getElementById('atributo-limpeza');
    
    // Por enquanto, apenas remove classe completo se não houver lógica específica
    // Lógica para verificar treino e limpeza pode ser adicionada aqui
}

// Expor funções globalmente
window.mostrarAbaDashboard = mostrarAbaDashboard;
window.atualizarBarrasStatusRPG = atualizarBarrasStatusRPG;
window.atualizarAtributosManutencao = atualizarAtributosManutencao;

// Inicialização
let pointsSystem;
let missionsSystem;
let shopSystem;
let navigationSystem;
let missionsBoard;
let dashboardSystem;

/**
 * Inicializa o app (chamado após autenticação)
 */
// Variável global para armazenar intervalo de reset de refeições
let resetRefeicoesInterval = null;

function inicializarApp() {
    // Evita inicialização duplicada
    if (pointsSystem) {
        return;
    }
    
    // Limpa intervalos anteriores se existirem (prevenção de múltiplos intervalos)
    if (resetRefeicoesInterval) {
        clearInterval(resetRefeicoesInterval);
        resetRefeicoesInterval = null;
    }
    
    // Inicializa sistemas
    pointsSystem = new PointsSystem();
    missionsSystem = new MissionsSystem(pointsSystem);
    shopSystem = new ShopSystem(pointsSystem);
    navigationSystem = new NavigationSystem();
    missionsBoard = new MissionsBoard();
    dashboardSystem = new DashboardSystem();

    // Torna sistemas acessíveis globalmente para os event handlers
    window.pointsSystem = pointsSystem;
    window.missionsSystem = missionsSystem;
    window.shopSystem = shopSystem;
    window.missionsBoard = missionsBoard;
    window.dashboardSystem = dashboardSystem;

    // Reseta missões diárias se necessário
    missionsSystem.resetDailyMissions();
    
    // Reseta missões do quadro diariamente (já é chamado no init do MissionsBoard)

    // Atualiza a loja quando os pontos mudam
    const originalAddPoints = pointsSystem.addPoints.bind(pointsSystem);
    pointsSystem.addPoints = function(amount) {
        originalAddPoints(amount);
        if (shopSystem) {
            shopSystem.renderShop();
        }
    };
    
    // Carregamento inicial mínimo (apenas dados essenciais do localStorage)
    loadWaterAmount(); // Carrega água do localStorage (rápido)
    verificarResetRefeicoes(); // Verifica reset (rápido)
    carregarRefeicoesMarcadas(); // Carrega do localStorage (rápido)
    atualizarBarrasStatusRPG(); // Atualiza barras (rápido)
    atualizarAtributosManutencao(); // Atualiza atributos (rápido)
    
    // Carrega tema do localStorage (rápido)
    carregarTemaRPG();
    
    // Inicializa Capacitor (necessário para notificações)
    inicializarCapacitor().then(() => {
        // Verifica reset de medicamentos (operação leve)
        verificarResetMedicamentosDiario();
    });
    
    // Carregamento sob demanda - apenas quando necessário
    // Configurações de notificação serão carregadas quando necessário
    // Medicamentos serão carregados quando navegar para Dashboard
    // Missões serão carregadas quando navegar para Quests
    
    // Otimização: Verifica reset de refeições a cada 60 segundos (não mais rápido)
    // CORREÇÃO: Armazena em variável para poder limpar se necessário
    if (resetRefeicoesInterval) {
        clearInterval(resetRefeicoesInterval);
    }
    resetRefeicoesInterval = setInterval(() => {
        try {
            verificarResetRefeicoes();
        } catch (error) {
            console.error('❌ Erro ao verificar reset de refeições:', error);
        }
    }, 60000); // 60 segundos
    
    // Navega para Dashboard como página inicial
    setTimeout(() => {
        if (navigationSystem) {
            navigationSystem.navigateTo('dashboard');
        }
    }, 100);
    
    // Fecha modal de configurações ao clicar fora
    const waterSettingsModal = document.getElementById('waterSettingsModal');
    if (waterSettingsModal) {
        waterSettingsModal.addEventListener('click', (e) => {
            if (e.target === waterSettingsModal) {
                closeWaterSettings();
            }
        });
    }
    
    // Carrega estado do Escudo de Rotina se existir
    const escudoSalvo = localStorage.getItem('escudoRotinaAtivo');
    const eventoSalvo = localStorage.getItem('eventoAtual');
    if (escudoSalvo === 'true' && eventoSalvo) {
        try {
            eventoAtual = JSON.parse(eventoSalvo);
            escudoRotinaAtivo = true;
            atualizarIndicadorEscudo();
        } catch (e) {
            console.error('Erro ao carregar escudo:', e);
        }
    }
    
    // Carrega estado dos Escudos
    loadEstadoEscudos();
    
    // Inicia verificação periódica do timer do escudo
    iniciarCheckEscudoTimer();
    
    // Atualiza menu FAB ao carregar
    atualizarMenuFABEscudo();
    
    // Verifica eventos externos ao carregar
    verificarEventosExternos();
    
    // Atualiza atributos de manutenção inicialmente
    atualizarAtributosManutencao();
    
    // Fecha FAB ao clicar fora
    document.addEventListener('click', (e) => {
        const fabContainer = document.querySelector('.fab-container');
        if (fabContainer && !fabContainer.contains(e.target) && fabMenuAberto) {
            closeFAB();
        }
    });
    
    // Fecha modal de agenda ao clicar fora
    const agendaModal = document.getElementById('agendaModal');
    if (agendaModal) {
        agendaModal.addEventListener('click', (e) => {
            if (e.target === agendaModal) {
                closeAgendaModal();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Primeiro, garante que a tela de login está visível inicialmente
    const loginScreen = document.getElementById('loginScreen');
    const creationScreen = document.getElementById('characterCreationScreen');
    const appContainer = document.getElementById('app-container');
    
    // Esconde todas as telas inicialmente
    if (loginScreen) loginScreen.classList.add('hidden');
    if (creationScreen) creationScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.add('hidden');
    
    // Configura listener de autenticação (deve ser primeiro)
    configurarAuthListener();
    
    // Configura input de nome
    configurarInputNome();
    
    // Configura botão de sincronizar realidade
    const finalizarBtn = document.getElementById('btn-finalizar-personagem');
    if (finalizarBtn) {
        finalizarBtn.addEventListener('click', sincronizarRealidade);
    }
    
    // Configura botão de login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Previne reload da página
            e.stopPropagation(); // Previne propagação do evento
            console.log('🔐 Botão de login clicado');
            enviarMagicLink();
        });
    }
    
    // Verifica autenticação ao carregar (vai decidir qual tela mostrar)
    // Se houver sessão, pula login e vai direto para dashboard
    verificarAutenticacao();
    
    // Permite Enter nos campos de login
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (passwordInput) {
                    passwordInput.focus();
                } else {
                    enviarMagicLink();
                }
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                enviarMagicLink();
            }
        });
    }
});

// Exemplo da lógica profissional que o Cursor deve seguir:
async function ativarEscudo(tipo) {
    const duracao = tipo === 'compromisso' ? 120 : null; // 2h ou indefinido
    const expira = duracao ? new Date(Date.now() + duracao * 60000) : null;
  
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
          modo_escudo: tipo, 
          escudo_expira_em: expira 
      })
      .eq('id', user.id);
  
    if (!error) {
        aplicarEfeitoVisualEscudo(tipo);
    }
  }