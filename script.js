// ============================================
// SISTEMA DE EVENTOS EXTERNOS E ESCUDO DE ROTINA
// ============================================

// Lista de compromissos da agenda (simulado - em produção viria de uma API)
const eventosAgenda = [
    {
        id: 1,
        titulo: 'Almoço em Família',
        data: new Date().toISOString().split('T')[0], // Hoje
        hora: '12:00',
        duracao: 90, // minutos
        tipo: 'social'
    },
    {
        id: 2,
        titulo: 'Reunião de Trabalho',
        data: new Date().toISOString().split('T')[0],
        hora: '14:30',
        duracao: 60,
        tipo: 'trabalho'
    },
    {
        id: 3,
        titulo: 'Academia',
        data: new Date().toISOString().split('T')[0],
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
    const dataAtual = agora.toISOString().split('T')[0];
    
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
            await supabaseClient
                .from('atividades')
                .insert([{
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
    
    // Confetes de celebração
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.9 },
            colors: ['#10b981', '#34d399', '#6ee7b7']
        });
    }
    
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
setInterval(() => {
    verificarEventosExternos();
}, 60000); // 1 minuto

// Verifica imediatamente ao carregar
verificarEventosExternos();

// ============================================
// CONFIGURAÇÃO DO SUPABASE
// ============================================

// Carrega configurações de variáveis de ambiente (Vercel) ou fallback para config.js
// No Vercel, as variáveis de ambiente são expostas via window.__ENV__ ou process.env
// Para desenvolvimento local, usa config.js
const SUPABASE_URL = 
    (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    window.SUPABASE_CONFIG?.url || 
    'SUA_URL_DO_SUPABASE_AQUI';

const SUPABASE_ANON_KEY = 
    (typeof window !== 'undefined' && window.__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    window.SUPABASE_CONFIG?.anonKey || 
    'SUA_ANON_KEY_AQUI';

// Configuração do Supabase com otimizações para região sa-east-1 (São Paulo)
// Nota: A região é configurada no projeto do Supabase, não no cliente
// Este cliente está otimizado para trabalhar com a região sa-east-1
const SUPABASE_OPTIONS = {
    db: {
        schema: 'public'
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'x-client-info': 'app-gamificacao/1.0.0'
        }
    }
};

// Inicializa o cliente Supabase com configuração para região sa-east-1
let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'SUA_URL_DO_SUPABASE_AQUI') {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_OPTIONS);
        console.log('%c✅ Supabase conectado com sucesso!', 'color: #10b981; font-weight: bold;');
        console.log('%c📍 Região: sa-east-1 (São Paulo)', 'color: #6366f1; font-weight: bold;');
        console.log('%c🔗 URL:', 'color: #6366f1; font-weight: bold;', SUPABASE_URL);
    } catch (error) {
        console.error('%c❌ Erro ao conectar ao Supabase:', 'color: #ef4444; font-weight: bold;', error);
    }
} else {
    console.warn('%c⚠️ Supabase não configurado', 'color: #f59e0b; font-weight: bold;');
    console.warn('Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo config.js ou .env');
}

// ============================================
// SISTEMA DE AUTENTICAÇÃO E PERFIL
// ============================================

let classeSelecionada = null;
let magicLinkCooldown = false; // Previne múltiplos envios
let magicLinkCooldownTimer = null;

/**
 * Envia Magic Link por e-mail
 */
async function enviarMagicLink() {
    // Previne múltiplos envios (rate limiting)
    if (magicLinkCooldown) {
        console.warn('Aguarde antes de enviar outro link');
        return;
    }
    
    const emailInput = document.getElementById('loginEmail');
    const loginBtn = document.getElementById('loginBtn');
    const loginMessage = document.getElementById('loginMessage');
    const loginSuccess = document.getElementById('loginSuccess');
    
    if (!emailInput || !supabaseClient) {
        console.error('Elementos não encontrados ou Supabase não configurado');
        return;
    }
    
    const email = emailInput.value.trim();
    
    if (!email || !email.includes('@')) {
        loginMessage.textContent = 'Por favor, insira um e-mail válido';
        loginMessage.className = 'text-center text-sm text-red-400';
        loginMessage.classList.remove('hidden');
        return;
    }
    
    // Ativa cooldown
    magicLinkCooldown = true;
    
    // Desabilita botão
    loginBtn.disabled = true;
    loginBtn.textContent = 'Enviando...';
    loginMessage.classList.add('hidden');
    loginSuccess.classList.add('hidden');
    
    try {
        const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });
        
        if (error) {
            // Se for erro 429 (Too Many Requests), mostra mensagem específica
            if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
                throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
            }
            throw error;
        }
        
        // Sucesso
        loginSuccess.classList.remove('hidden');
        loginMessage.classList.add('hidden');
        loginBtn.textContent = 'Link Enviado!';
        
        console.log('%c📧 Magic Link enviado com sucesso!', 'color: #10b981; font-weight: bold;');
        
        // Cooldown de 60 segundos após sucesso
        iniciarCooldownMagicLink(60);
        
    } catch (error) {
        console.error('Erro ao enviar Magic Link:', error);
        
        let mensagemErro = error.message || 'Erro ao enviar link. Tente novamente.';
        let cooldownSegundos = 30; // Cooldown padrão
        
        // Mensagem específica para rate limiting
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            mensagemErro = 'Muitas tentativas. Aguarde 2 minutos antes de tentar novamente.';
            cooldownSegundos = 120; // 2 minutos de cooldown
        }
        
        loginMessage.textContent = mensagemErro;
        loginMessage.className = 'text-center text-sm text-red-400';
        loginMessage.classList.remove('hidden');
        
        // Inicia cooldown
        iniciarCooldownMagicLink(cooldownSegundos);
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
    const nameInput = document.getElementById('characterName');
    const createBtn = document.getElementById('createCharacterBtn');
    const messageEl = document.getElementById('characterCreationMessage');
    
    if (!nameInput || !createBtn || !supabaseClient) {
        return;
    }
    
    const nome = nameInput.value.trim();
    
    if (!nome || nome.length < 2) {
        messageEl.textContent = 'O nome deve ter pelo menos 2 caracteres';
        messageEl.className = 'text-center text-sm text-red-400';
        messageEl.classList.remove('hidden');
        return;
    }
    
    if (!classeSelecionada) {
        messageEl.textContent = 'Selecione uma classe';
        messageEl.className = 'text-center text-sm text-red-400';
        messageEl.classList.remove('hidden');
        return;
    }
    
    // Desabilita botão
    createBtn.disabled = true;
    createBtn.textContent = 'Criando...';
    messageEl.classList.add('hidden');
    
    try {
        // Obtém usuário atual
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) {
            throw new Error('Usuário não autenticado');
        }
        
        // Cria perfil com ID do usuário logado
        const { data: profileData, error } = await supabaseClient
            .from('profiles')
            .insert([{
                id: user.id, // ID vindo do Auth do Google/Magic Link
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
        
        if (error) {
            console.error('Erro ao criar perfil:', error);
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
                
                // Navega para Dashboard após animação
                setTimeout(() => {
                    if (navigationSystem) {
                        navigationSystem.navigateTo('stats');
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
    if (!supabaseClient) {
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
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        
        if (sessionError) {
            throw sessionError;
        }
        
        // Se não houver sessão, mostra tela de login
        if (!session) {
            const loginScreen = document.getElementById('loginScreen');
            const appContainer = document.getElementById('app-container');
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (appContainer) appContainer.classList.add('hidden');
            return;
        }
        
        // Verifica se existe perfil
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 = nenhuma linha encontrada (normal se não tiver perfil)
            throw profileError;
        }
        
        // Se não tiver perfil, mostra tela de criação
        if (!profile) {
            const loginScreen = document.getElementById('loginScreen');
            const creationScreen = document.getElementById('characterCreationScreen');
            const appContainer = document.getElementById('app-container');
            
            if (loginScreen) loginScreen.classList.add('hidden');
            if (creationScreen) creationScreen.classList.remove('hidden');
            if (appContainer) appContainer.classList.add('hidden');
            return;
        }
        
        // Tudo OK - mostra app
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
        
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Em caso de erro, mostra tela de login
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('app-container');
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
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
            await verificarAutenticacao();
        } else if (event === 'SIGNED_OUT') {
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
    if (!supabaseClient) {
        window.userProfile = null;
        return;
    }
    
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            window.userProfile = null;
            return;
        }
        
        const { data: profile, error } = await supabaseClient
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
    }
}

// Torna funções acessíveis globalmente
window.enviarMagicLink = enviarMagicLink;
window.selecionarClasse = selecionarClasse;
window.criarPersonagem = criarPersonagem;

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

        container.innerHTML = '';

        // Identifica a missão mais importante (primeira não completada ou a de maior recompensa)
        const incompleteMissions = this.missions.filter(m => !m.completed);
        const mostImportantMission = incompleteMissions.length > 0 
            ? incompleteMissions.reduce((prev, current) => 
                (current.reward || 0) > (prev.reward || 0) ? current : prev
              )
            : null;

        this.missions.forEach(mission => {
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
            'dashboard': 'stats',
            'inventory': 'inventory',
            'stats': 'stats',
            'profile': 'profile'
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
            'missions': document.getElementById('missions-page'),
            'inventory': document.getElementById('inventory-page'),
            'stats': document.getElementById('stats-page'),
            'profile': document.getElementById('profile-page')
        };

        Object.keys(pages).forEach(pageKey => {
            const pageEl = pages[pageKey];
            if (pageEl) {
                if (pageKey === targetPage) {
                    pageEl.classList.remove('page-hidden');
                    pageEl.classList.add('page-visible');
                } else {
                    pageEl.classList.remove('page-visible');
                    pageEl.classList.add('page-hidden');
                }
            }
        });

        // Mostra/esconde botão flutuante
        // Botão FAB agora é usado para adicionar missões
        // const addBtn = document.getElementById('addMissionBtn');
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
        const energiaPorDia = this.calcularEnergiaPorDia(dados);
        
        // Calcula streak de Higiene/Saúde
        const streak = await this.calcularStreak(dados);
        
        // Atualiza UI
        this.atualizarStreak(streak);
        this.renderizarGrafico(energiaPorDia);
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
            
            const dataStr = data.toISOString().split('T')[0];
            
            // Soma energia do dia
            const energiaDoDia = atividadesComEnergia
                .filter(item => {
                    const itemDate = new Date(item.data_completada);
                    itemDate.setHours(0, 0, 0, 0);
                    return itemDate.toISOString().split('T')[0] === dataStr;
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
            const dataStr = data.toISOString().split('T')[0];
            
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
                            diasRecuperacao.add(dataRecuperacao.toISOString().split('T')[0]);
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
            const dataStr = dataVerificar.toISOString().split('T')[0];
            
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
        const ctx = document.getElementById('energyChart');
        if (!ctx) return;

        // Destrói gráfico anterior se existir
        if (this.chart) {
            this.chart.destroy();
        }

        // Prepara dados
        const labels = energiaPorDia.map(item => {
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

        const energiaData = energiaPorDia.map(item => item.energia);

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

        grid.innerHTML = '';

        const activeMissions = this.missions.filter(m => !m.completed);
        const completedMissions = this.missions.filter(m => m.completed);

        activeMissions.forEach(mission => {
            grid.appendChild(this.createMissionCard(mission));
        });

        completedMissions.forEach(mission => {
            grid.appendChild(this.createMissionCard(mission, true));
        });

        this.updateEmptyState();
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

    try {
        const atividade = {
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

    try {
        const atividade = {
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

        // Busca todas as atividades dos últimos 30 dias
        const { data, error } = await supabaseClient
            .from('historico_atividades')
            .select('*')
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('%c✅ Service Worker registrado com sucesso!', 'color: #10b981; font-weight: bold;');
                console.log('📱 PWA instalável:', registration.scope);
                
                // Verifica se há atualizações
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('%c🔄 Nova versão disponível!', 'color: #f59e0b; font-weight: bold;');
                            // Pode mostrar notificação para o usuário atualizar
                        }
                    });
                });
            })
            .catch((error) => {
                console.warn('%c⚠️ Erro ao registrar Service Worker:', 'color: #f59e0b; font-weight: bold;', error);
            });
        
        // Escuta mensagens do service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_READY') {
                console.log('%c✅ Service Worker pronto!', 'color: #10b981; font-weight: bold;');
            }
        });
    });
}

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
    waterAmount = Math.min(waterAmount + 250, waterTarget);
    
    // Atualiza a UI
    updateWaterWidget();
    
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
            const waterLog = {
                activity: 'water_intake',
                amount: 250,
                unit: 'ml',
                timestamp: new Date().toISOString()
            };
            
            // Envia o objeto específico para a tabela atividades
            await supabaseClient
                .from('atividades')
                .insert([waterLog]);
            
            console.log('%c💧 Registro de água salvo no Supabase', 'color: #3b82f6; font-weight: bold;');
            console.log('%c📊 Objeto enviado:', 'color: #3b82f6; font-weight: bold;', waterLog);
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
    const percentage = Math.round((waterAmount / waterTarget) * 100);
    const percentageEl = document.getElementById('waterPercentage');
    const amountEl = document.getElementById('waterAmount');
    const circleEl = document.getElementById('waterProgressCircle');
    
    if (percentageEl) {
        percentageEl.textContent = `${percentage}%`;
    }
    
    if (amountEl) {
        amountEl.textContent = waterAmount;
    }
    
    if (circleEl) {
        const circumference = 2 * Math.PI * 35;
        const offset = circumference - (percentage / 100) * circumference;
        circleEl.style.strokeDashoffset = offset;
    }
}

/**
 * Carrega a quantidade de água do localStorage
 */
function loadWaterAmount() {
    const saved = localStorage.getItem('waterAmount');
    waterAmount = saved ? parseInt(saved, 10) : 0;
    
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
            // Tenta atualizar ou inserir no perfil do usuário
            // Assumindo que existe uma tabela 'perfil' ou 'usuarios'
            // Ajuste conforme sua estrutura de banco
            const { error } = await supabaseClient
                .from('perfil')
                .upsert({
                    intervalo_alerta_agua: waterAlertInterval,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id' // Ajuste conforme sua chave primária
                });
            
            if (error) {
                console.warn('Erro ao salvar no Supabase (pode não existir tabela perfil):', error);
                // Tenta salvar em atividades como fallback
                await supabaseClient
                    .from('atividades')
                    .insert([{
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
    const collapsed = document.getElementById('focusTimerCollapsed');
    const expanded = document.getElementById('focusTimerExpanded');
    
    if (collapsed) collapsed.classList.add('hidden');
    if (expanded) expanded.classList.remove('hidden');
    
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
    if (pauseBtn) pauseBtn.classList.remove('hidden');
    if (resumeBtn) resumeBtn.classList.add('hidden');
    
    focusTimerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - focusTimerStartTime) / 1000);
        focusTimerRemaining = Math.max(0, 600 - elapsed);
        
        updateFocusTimerDisplay();
        
        if (focusTimerRemaining <= 0) {
            finishFocusTimer();
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
    if (pauseBtn) pauseBtn.classList.add('hidden');
    if (resumeBtn) resumeBtn.classList.remove('hidden');
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
            await supabaseClient
                .from('atividades')
                .insert([{
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
    if (display) {
        const minutes = Math.floor(focusTimerRemaining / 60);
        const seconds = focusTimerRemaining % 60;
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// ============================================
// MENU DE AÇÕES RÁPIDAS (FAB) E MODO AVENTURA
// ============================================

/**
 * Abre/fecha o menu FAB
 */
function toggleFAB() {
    const fabMenu = document.getElementById('fabMenu');
    const fabMainBtn = document.getElementById('fabMainBtn');
    const fabMainIcon = document.getElementById('fabMainIcon');
    
    if (!fabMenu || !fabMainBtn) return;
    
    fabMenuAberto = !fabMenuAberto;
    
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
    const hoje = new Date().toISOString().split('T')[0];
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
            // Tenta atualizar/inserir no perfil
            const { error } = await supabaseClient
                .from('perfil')
                .upsert({
                    modo_aventura_ativo: modoAventuraAtivo,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id' // Ajuste conforme sua chave primária
                });
            
            if (error) {
                console.warn('Erro ao salvar no Supabase (pode não existir tabela perfil):', error);
                // Fallback: salva em atividades
                await supabaseClient
                    .from('atividades')
                    .insert([{
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
 * Ativa Escudo de Compromisso (2 horas, ou 1h30 para Hiperfocado)
 */
async function ativarEscudoCompromisso() {
    // Desativa qualquer escudo anterior
    desativarTodosEscudos();
    
    modoEscudoAtivo = 'compromisso';
    
    // O Hiperfocado tem escudo de 1h30 (gasta energia mais rápido)
    let duracaoMinutos = 120; // 2 horas padrão
    if (window.userProfile && window.userProfile.classe === 'O Hiperfocado') {
        duracaoMinutos = 90; // 1h30 para Hiperfocado
        console.log('%c🎯 Escudo de Compromisso reduzido para 1h30 (Hiperfocado)', 'color: #3b82f6; font-weight: bold;');
    }
    
    escudoCompromissoTempoRestante = duracaoMinutos * 60; // em segundos
    
    const body = document.body;
    body.classList.add('border-shield-compromisso');
    body.classList.remove('border-shield-recuperacao', 'modo-recuperacao');
    
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
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
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
    
    // Inicia timer
    iniciarTimerCompromisso();
}

/**
 * Inicia timer do Escudo de Compromisso
 */
function iniciarTimerCompromisso() {
    // Limpa timer anterior se existir
    if (escudoCompromissoInterval) {
        clearInterval(escudoCompromissoInterval);
    }
    
    escudoCompromissoInterval = setInterval(() => {
        escudoCompromissoTempoRestante--;
        
        // Salva tempo restante
        localStorage.setItem('escudoCompromissoTempoRestante', escudoCompromissoTempoRestante.toString());
        
        if (escudoCompromissoTempoRestante <= 0) {
            finalizarEscudoCompromisso();
        }
    }, 1000);
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
    
    // Remove borda
    const body = document.body;
    body.classList.remove('border-shield-compromisso');
    
    modoEscudoAtivo = 'desativado';
    
    // Salva no Supabase
    if (supabaseClient) {
        try {
            await supabaseClient
                .from('profiles')
                .upsert({
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
    localStorage.removeItem('escudoCompromissoTempoRestante');
    localStorage.removeItem('escudoExpiraEm');
    
    // Reativa alertas de água
    if (waterAlertInterval > 0) {
        startWaterAlertCheck();
    }
    
    // Mostra notificação
    mostrarNotificacaoCompromisso();
    
    console.log('%c🛡️ Escudo de Compromisso finalizado', 'color: #f59e0b; font-weight: bold;');
}

/**
 * Mostra notificação quando compromisso acaba
 */
function mostrarNotificacaoCompromisso() {
    const notificacao = document.getElementById('compromissoNotificacao');
    if (notificacao) {
        notificacao.classList.remove('hidden');
        
        // Fecha automaticamente após 10 segundos
        setTimeout(() => {
            fecharNotificacaoCompromisso();
        }, 10000);
    }
}

/**
 * Fecha notificação de compromisso
 */
function fecharNotificacaoCompromisso() {
    const notificacao = document.getElementById('compromissoNotificacao');
    if (notificacao) {
        notificacao.classList.add('hidden');
    }
}

/**
 * Ativa Escudo de Recuperação
 */
async function ativarEscudoRecuperacao() {
    // Desativa qualquer escudo anterior
    desativarTodosEscudos();
    
    modoEscudoAtivo = 'recuperacao';
    
    const body = document.body;
    body.classList.add('border-shield-recuperacao', 'modo-recuperacao');
    body.classList.remove('border-shield-compromisso');
    
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
            const { error } = await supabaseClient
                .from('profiles')
                .upsert({
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
    body.classList.remove('border-shield-recuperacao', 'modo-recuperacao');
    
    // Esconde overlay
    const overlay = document.getElementById('recuperacaoOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    
    modoEscudoAtivo = 'desativado';
    
    // Salva no Supabase
    if (supabaseClient) {
        try {
            await supabaseClient
                .from('profiles')
                .upsert({
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
 * Desativa todos os escudos
 */
function desativarTodosEscudos() {
    // Para timer de compromisso se estiver ativo
    if (escudoCompromissoInterval) {
        clearInterval(escudoCompromissoInterval);
        escudoCompromissoInterval = null;
    }
    
    // Remove todas as classes de borda
    const body = document.body;
    body.classList.remove('border-shield-compromisso', 'border-shield-recuperacao', 'modo-recuperacao');
    
    // Esconde overlay de recuperação
    const overlay = document.getElementById('recuperacaoOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
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
                body.classList.add('border-shield-compromisso');
                
                // Inicia timer
                iniciarTimerCompromisso();
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
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('modo_escudo, escudo_expira_em')
                .limit(1)
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
                            body.classList.add('border-shield-compromisso');
                            
                            iniciarTimerCompromisso();
                        } else {
                            // Expirou no servidor, atualiza
                            modoEscudoAtivo = 'desativado';
                            await supabaseClient
                                .from('profiles')
                                .upsert({
                                    modo_escudo: 'desativado',
                                    escudo_expira_em: null
                                }, {
                                    onConflict: 'id'
                                });
                        }
                    } else if (modoEscudoAtivo === 'recuperacao') {
                        const body = document.body;
                        body.classList.add('border-shield-recuperacao', 'modo-recuperacao');
                        
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
window.ativarEscudoCompromisso = ativarEscudoCompromisso;
window.ativarEscudoRecuperacao = ativarEscudoRecuperacao;
window.desativarEscudoRecuperacao = desativarEscudoRecuperacao;
window.fecharNotificacaoCompromisso = fecharNotificacaoCompromisso;
window.verAgenda = verAgenda;
window.closeAgendaModal = closeAgendaModal;

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
function inicializarApp() {
    // Evita inicialização duplicada
    if (pointsSystem) {
        return;
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
    
    // Inicializa widgets de ações instantâneas
    loadWaterAmount();
    
    // Reseta água diariamente
    const today = new Date().toDateString();
    const lastWaterReset = localStorage.getItem('lastWaterReset');
    if (lastWaterReset !== today) {
        waterAmount = 0;
        localStorage.setItem('waterAmount', '0');
        localStorage.setItem('lastWaterReset', today);
        // Reseta também o último tempo de água
        lastWaterTime = null;
        localStorage.removeItem('lastWaterTime');
        updateWaterWidget();
    }
    
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
    
    // Verifica eventos externos ao carregar
    verificarEventosExternos();
    
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
    
    // Configura botão de login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            enviarMagicLink();
        });
    }
    
    // Verifica autenticação ao carregar (vai decidir qual tela mostrar)
    verificarAutenticacao();
    
    // Permite Enter no campo de e-mail
    const emailInput = document.getElementById('loginEmail');
    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
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