// Log para verificar se o script está sendo carregado
console.log('🚀 main.jsx carregado');

// ============================================
// IMPORTS DO REACT (PRIORIDADE MÁXIMA)
// ============================================
// Importa React ANTES de qualquer coisa que possa travar
// Isso garante que o React esteja disponível mesmo se o Supabase falhar
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ============================================
// RENDERIZAÇÃO IMEDIATA DO REACT
// ============================================
// Renderiza React IMEDIATAMENTE, antes de qualquer outra inicialização
// Isso garante que a interface apareça mesmo se o Supabase ou outras coisas falharem
if (typeof document !== 'undefined') {
  try {
    // Aguarda o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        renderReactApp();
      });
    } else {
      // DOM já está pronto, renderiza imediatamente
      renderReactApp();
    }
  } catch (renderError) {
    console.error('❌ Erro ao configurar renderização do React:', renderError);
    // Tenta renderizar mesmo assim após um delay
    setTimeout(() => {
      try {
        renderReactApp();
      } catch (retryError) {
        console.error('❌ Erro ao renderizar React (retry):', retryError);
      }
    }, 100);
  }
}

/**
 * Função para renderizar o React App
 * Separada para poder ser chamada em diferentes momentos
 */
function renderReactApp() {
  try {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      console.log('⚛️ React renderizado com sucesso');
      console.log('✅ React App renderizado');
    } else {
      console.warn('⚠️ Elemento #root não encontrado, tentando criar...');
      // Tenta criar o elemento se não existir
      const body = document.body;
      if (body) {
        const newRoot = document.createElement('div');
        newRoot.id = 'root';
        body.appendChild(newRoot);
        const root = ReactDOM.createRoot(newRoot);
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
        console.log('⚛️ React renderizado com sucesso (elemento criado)');
        console.log('✅ React App renderizado');
      } else {
        console.error('❌ document.body não encontrado');
      }
    }
  } catch (renderError) {
    console.error('❌ Erro crítico ao renderizar React:', renderError);
    // Tenta mostrar uma mensagem de erro na tela
    if (typeof document !== 'undefined' && document.body) {
      try {
        document.body.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; flex-direction: column; padding: 20px; text-align: center;">
            <h1 style="color: #ef4444; margin-bottom: 20px;">⚠️ Erro ao Renderizar App</h1>
            <p style="color: #94a3b8; margin-bottom: 10px;">Ocorreu um erro ao inicializar o React.</p>
            <p style="color: #94a3b8; font-size: 12px;">Por favor, recarregue a página.</p>
            <p style="color: #64748b; font-size: 10px; margin-top: 20px;">Erro: ${renderError.message || 'Desconhecido'}</p>
          </div>
        `;
      } catch (domError) {
        console.error('❌ Erro ao atualizar DOM:', domError);
      }
    }
  }
}

// ============================================
// SAFE BOOT - INICIALIZAÇÃO SEGURA
// ============================================

// Declara TODAS as variáveis globais ANTES de qualquer coisa
if (typeof window !== 'undefined') {
  // Variáveis de controle de carregamento
  window.missionsDataLoaded = window.missionsDataLoaded || false;
  window.dashboardDataLoaded = window.dashboardDataLoaded || false;
  
  // Funções críticas com placeholders seguros
  window.aplicarTema = window.aplicarTema || function(tema) {
    try {
      const body = document.body;
      const main = document.querySelector('main');
      if (tema === 'rpg') {
        if (body) body.classList.add('tema-rpg');
        if (main) main.classList.add('bg-[#000000]');
      } else {
        if (body) body.classList.remove('tema-rpg');
        if (main) main.classList.remove('bg-[#000000]');
      }
    } catch (e) {
      console.warn('⚠️ Erro ao aplicar tema:', e);
    }
  };
  
  window.alternarTema = window.alternarTema || function(tema) {
    console.log('⚠️ alternarTema pendente, tema:', tema);
  };
  
  window.alternarTemaRPG = window.alternarTemaRPG || function() {
    console.log('⚠️ alternarTemaRPG pendente');
  };
  
  console.log('✅ Safe Boot: Variáveis globais inicializadas');
}

// Importa o Supabase como módulo ES6
import { createClient } from '@supabase/supabase-js';

// Importa Capacitor Core para verificação de plataforma
import { Capacitor } from '@capacitor/core';

// Importa Capacitor App para Deep Linking
// Renomeado para CapacitorApp para evitar conflito com o componente React App
import { App as CapacitorApp } from '@capacitor/app';

// Importa Capacitor Local Notifications
import { LocalNotifications } from '@capacitor/local-notifications';

// Importa SplashScreen para controle seguro
import { SplashScreen } from '@capacitor/splash-screen';

// Importa os estilos
import './index.css';

// O Vite exige 'import.meta.env' para ler as variáveis que você salvou na Vercel
// No Capacitor, pode falhar, então usamos fallback fixo
// IMPORTANTE: Envolvido em try/catch para evitar travamento no Android
let supabaseUrl = null;
let supabaseKey = null;

try {
  // Tenta ler import.meta.env de forma segura
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
} catch (envError) {
  console.warn('⚠️ Erro ao ler import.meta.env:', envError);
  // Continua sem as variáveis, vai tentar localStorage depois
}

// Fallback fixo para Capacitor se import.meta.env falhar
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;

// Tenta ler do localStorage primeiro (mais confiável no Capacitor)
if (isCapacitor) {
  const storedUrl = localStorage.getItem('supabase_url');
  const storedKey = localStorage.getItem('supabase_key');
  
  if (storedUrl && storedKey) {
    supabaseUrl = storedUrl;
    supabaseKey = storedKey;
    console.log('✅ Variáveis do Supabase carregadas do localStorage (Capacitor)');
  } else if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Variáveis de ambiente não encontradas no Capacitor');
    console.warn('💡 Configure via: localStorage.setItem("supabase_url", "...") e localStorage.setItem("supabase_key", "...")');
  }
}

// Se ainda não tiver, tenta import.meta.env novamente (com try/catch)
if (!supabaseUrl || !supabaseKey) {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      supabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseUrl;
      supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseKey;
    }
  } catch (envError) {
    console.warn('⚠️ Erro ao ler import.meta.env (segunda tentativa):', envError);
  }
}

console.log('📦 Variáveis de ambiente carregadas:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseKey,
  isCapacitor: isCapacitor,
  urlSource: supabaseUrl ? 'found' : 'missing',
  urlStartsWithHttps: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'N/A'
});

// Se as variáveis estiverem vazias, o app avisa (ajuda no TDAH para não ficar tentando logar sem conexão)
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Erro: As chaves do Supabase não foram encontradas!");
  console.error("💡 Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY");
  console.error("💡 Ou defina localStorage.setItem('supabase_url', '...') e localStorage.setItem('supabase_key', '...')");
}

// Inicializa o cliente Supabase com configurações otimizadas
let supabaseClient = null;

/**
 * Função helper para obter o cliente Supabase
 * Exportada para uso em outros componentes
 * IMPORTANTE: Nunca tenta ler import.meta.env aqui, apenas retorna o cliente já criado
 */
export function getSupabaseClient() {
  // Retorna o cliente já criado, sem tentar ler variáveis de ambiente
  return supabaseClient || window.supabaseClient || null;
}

// Envolve toda a inicialização do Supabase em try/catch para evitar travamento
// IMPORTANTE: Só cria o cliente UMA VEZ - não reinicia desnecessariamente
try {
  // Verifica se já existe um cliente (evita recriação)
  if (supabaseClient) {
    console.log('✅ Cliente Supabase já existe, reutilizando...');
  } else if (supabaseUrl && supabaseKey) {
    // Verifica se a URL está correta (deve começar com https://)
    if (!supabaseUrl.startsWith('https://')) {
      console.error('❌ URL do Supabase inválida - deve começar com https://');
      console.error('URL recebida:', supabaseUrl.substring(0, 50));
    }
    
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        db: {
          schema: 'public'
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined
        },
        global: {
          headers: {
            'x-client-info': 'app-gamificacao/1.0.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      });
      // Expõe globalmente IMEDIATAMENTE para o script.js usar
      if (typeof window !== 'undefined') {
        window.supabaseClient = supabaseClient;
        // Cria um objeto supabase global para compatibilidade com script.js
        window.supabase = {
          createClient: createClient
        };
      }
      console.log('✅ Supabase conectado com sucesso!');
      console.log('✅ Supabase disponível globalmente em window.supabaseClient');
      
      // Verifica sessão ao carregar - se existir, mantém logado
      // Isso garante que a sessão seja restaurada mesmo após fechar o app
      // Envolvido em try/catch para não travar se houver erro
      supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
        if (error) {
          console.warn('Erro ao verificar sessão:', error);
          return;
        }
        
        if (session) {
          console.log('✅ Sessão encontrada, usuário já está logado:', session.user?.email || 'sem email');
          // A sessão já está ativa, o script.js vai verificar e navegar automaticamente
          // Marca que há sessão para o script.js não mostrar login
          if (typeof window !== 'undefined') {
            window.hasActiveSession = true;
          }
        } else {
          console.log('ℹ️ Nenhuma sessão encontrada, será necessário fazer login');
          if (typeof window !== 'undefined') {
            window.hasActiveSession = false;
          }
        }
      }).catch((sessionError) => {
        console.warn('⚠️ Erro ao verificar sessão (catch):', sessionError);
      });
      
    } catch (createError) {
      console.error('❌ Erro ao criar cliente Supabase:', createError);
      // Continua sem Supabase, o app ainda pode funcionar
    }
  } else {
    console.warn('⚠️ Supabase não configurado - variáveis de ambiente ausentes');
    console.warn('💡 O app continuará funcionando, mas sem autenticação');
  }
} catch (supabaseInitError) {
  console.error('❌ Erro crítico ao inicializar Supabase:', supabaseInitError);
  // Continua mesmo com erro - o React deve renderizar
}

// Configura Deep Linking para OAuth do Supabase
// Captura o token quando o navegador retorna para o app após login OAuth
// APENAS em plataforma nativa
if (Capacitor.isNativePlatform() && CapacitorApp) {
  try {
    // Verifica se Capacitor está disponível antes de adicionar listener
    if (CapacitorApp.addListener) {
      CapacitorApp.addListener('appUrlOpen', async (event) => {
        try {
          console.log('🔗 Deep Link capturado:', event.url);
          
          // Verifica se é uma URL de callback do Supabase
          if (event.url && event.url.includes('capacitor://localhost')) {
            // O Supabase pode retornar tokens em formato de hash (#) ou query string (?)
            // Exemplo: capacitor://localhost#access_token=... ou capacitor://localhost?access_token=...
            let urlString = event.url;
            
            // Se tiver hash, converte para query string para facilitar parsing
            if (urlString.includes('#')) {
              urlString = urlString.replace('#', '?');
            }
            
            // Extrai os parâmetros da URL
            const url = new URL(urlString);
            const accessToken = url.searchParams.get('access_token');
            const refreshToken = url.searchParams.get('refresh_token');
            const error = url.searchParams.get('error');
            const errorDescription = url.searchParams.get('error_description');
            
            if (error) {
              console.error('❌ Erro no OAuth:', error, errorDescription);
              try {
                alert(`Erro ao fazer login: ${errorDescription || error}`);
              } catch (alertError) {
                console.error('Erro ao mostrar alert:', alertError);
              }
              return;
            }
            
            if (accessToken && refreshToken && supabaseClient) {
              console.log('🔐 Tokens recebidos, estabelecendo sessão...');
              
              // Define a sessão com os tokens recebidos usando setSession
              const { data: sessionData, error: sessionError } = await supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (sessionError) {
                console.error('❌ Erro ao definir sessão:', sessionError);
                try {
                  alert(`Erro ao fazer login: ${sessionError.message}`);
                } catch (alertError) {
                  console.error('Erro ao mostrar alert:', alertError);
                }
                return;
              }
              
              if (sessionData.session) {
                console.log('✅ Sessão OAuth estabelecida com sucesso!', sessionData.session.user?.email);
                
                // Atualiza a variável global currentUser
                window.currentUser = sessionData.session.user;
                window.hasActiveSession = true;
                
                // Dispara evento para o script.js processar
                // Chama sem await para não bloquear o processamento
                if (window.verificarAutenticacao) {
                  window.verificarAutenticacao().catch(err => {
                    console.warn('⚠️ Erro ao verificar autenticação (não bloqueante):', err);
                  });
                } else {
                  console.warn('⚠️ verificarAutenticacao não está disponível ainda');
                }
              } else {
                console.error('❌ Sessão não foi criada');
              }
            } else {
              console.warn('⚠️ Tokens não encontrados na URL:', event.url);
            }
          }
        } catch (error) {
          console.error('❌ Erro ao processar Deep Link:', error);
          try {
            alert(`Erro ao processar login: ${error.message}`);
          } catch (alertError) {
            console.error('Erro ao mostrar alert:', alertError);
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao configurar listener de Deep Linking:', error);
  }
}

console.log('✅ Listener de Deep Linking configurado');

// ============================================
// CONFIGURAÇÃO DE NOTIFICAÇÕES NATIVAS
// ============================================

// Configura action types e listeners de notificações
async function configurarNotificacoesNativas() {
  try {
    // Verifica se está em plataforma nativa
    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Rodando em modo Web: Notificações nativas ignoradas');
      return;
    }

    // Registra os tipos de ação para notificações
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'MED_REMINDER',
        actions: [
          { id: 'TOMAR', title: '💊 Tomar Agora', foreground: true },
          { id: 'ADIAR', title: '⏳ Adiar 30 min', foreground: false }
        ]
      }]
    });

    console.log('✅ Action types de notificações registrados');

    // Adiciona listener para ações de notificações
    await LocalNotifications.addListener('actionPerformed', async (action) => {
      console.log('🔔 Ação de notificação recebida:', action);
      
      const actionId = action.actionId;
      const notification = action.notification || action;
      const extra = notification.extra || {};
      const medicamentoId = extra.medicamentoId;
      const nome = extra.nome || '';
      const dosagem = extra.dosagem || '';
      const horario = extra.horario || '';

      if (actionId === 'TOMAR') {
        console.log('💊 Ação TOMAR recebida para medicamento:', medicamentoId);
        
        // Chama função de registrar ingestão (aguarda script.js carregar se necessário)
        if (window.tomarMedicamento) {
          await window.tomarMedicamento(medicamentoId);
        } else if (window.confirmarIngestaoMedicamento) {
          await window.confirmarIngestaoMedicamento(medicamentoId);
        } else {
          console.warn('⚠️ Função tomarMedicamento ainda não disponível, aguardando...');
          // Tenta novamente após um delay
          setTimeout(async () => {
            if (window.tomarMedicamento) {
              await window.tomarMedicamento(medicamentoId);
            }
          }, 1000);
        }
      } else if (actionId === 'ADIAR') {
        console.log('⏳ Ação ADIAR recebida para medicamento:', medicamentoId);
        
        // Chama função de adiar (aguarda script.js carregar se necessário)
        if (window.adiarMedicamento30min) {
          await window.adiarMedicamento30min(medicamentoId, nome, dosagem, horario);
        } else {
          console.warn('⚠️ Função adiarMedicamento30min ainda não disponível, aguardando...');
          // Tenta novamente após um delay
          setTimeout(async () => {
            if (window.adiarMedicamento30min) {
              await window.adiarMedicamento30min(medicamentoId, nome, dosagem, horario);
            }
          }, 1000);
        }
      }
    });

    console.log('✅ Listener de ações de notificações configurado');
  } catch (error) {
    console.error('❌ Erro ao configurar notificações nativas:', error);
  }
}

// Configura notificações APENAS em plataforma nativa
if (Capacitor.isNativePlatform()) {
  // Aguarda um pouco para garantir que tudo está carregado
  setTimeout(() => {
    try {
      configurarNotificacoesNativas();
    } catch (error) {
      console.error('❌ Erro ao configurar notificações:', error);
    }
  }, 500);
} else {
  console.log('🌐 Rodando em modo Web: Plugins nativos ignorados');
}

// Função para esconder o Splash Screen de forma segura
async function hideSplashScreenSafely() {
  try {
    if (SplashScreen) {
      await SplashScreen.hide();
      console.log('✅ Splash Screen escondido com sucesso');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao esconder Splash Screen:', error);
  }
}

// Esconde o Splash Screen APENAS em plataforma nativa
if (Capacitor.isNativePlatform()) {
  // Aguarda o DOM estar pronto e o script.js carregar
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        hideSplashScreenSafely();
      }, 1000); // Delay de 1 segundo para garantir que tudo carregou
    });
    
    // Fallback: esconde após 3 segundos mesmo se houver erro
    setTimeout(() => {
      hideSplashScreenSafely();
    }, 3000);
  }
} else {
  console.log('🌐 Rodando em modo Web: SplashScreen ignorado');
}

// React já foi renderizado no topo do arquivo (linha ~46)
// Não precisa renderizar novamente aqui

// ============================================
// CARREGAMENTO DO SCRIPT.JS (EM BACKGROUND)
// ============================================
// Importa a lógica principal da aplicação com tratamento de erro
// Usa import dinâmico com tratamento de erro seguro
// Carrega em background, não bloqueia o React
// IMPORTANTE: React já foi renderizado acima, então o script.js pode falhar sem travar o app
(async () => {
  try {
    // Aguarda um pouco para o React renderizar primeiro
    await new Promise(resolve => setTimeout(resolve, 100));
    await import('../script.js');
    console.log('✅ script.js carregado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao carregar script.js:', error);
    // Não mostra erro na tela - o React já está renderizado
    // O app continua funcionando, apenas sem algumas funcionalidades do script.js
  }
})();

// O HTML já está no index.html, então não precisamos injetar nada
// A lógica da aplicação será carregada através do script.js
