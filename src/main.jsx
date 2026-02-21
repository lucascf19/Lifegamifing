// Log para verificar se o script está sendo carregado
console.log('🚀 main.jsx carregado');

// Importa o Supabase como módulo ES6
import { createClient } from '@supabase/supabase-js';

// Importa Capacitor App para Deep Linking
import { App } from '@capacitor/app';

// Importa os estilos
import './index.css';

// O Vite exige 'import.meta.env' para ler as variáveis que você salvou na Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('📦 Variáveis de ambiente carregadas:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseKey 
});

// Se as variáveis estiverem vazias, o app avisa (ajuda no TDAH para não ficar tentando logar sem conexão)
if (!supabaseUrl || !supabaseKey) {
  console.error("Erro de Chão: As chaves do Supabase não foram encontradas! Verifique o painel da Vercel.");
}

// Inicializa o cliente Supabase com configurações otimizadas
let supabaseClient = null;
if (supabaseUrl && supabaseKey) {
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
    // Expõe globalmente para o script.js usar
    window.supabaseClient = supabaseClient;
    // Cria um objeto supabase global para compatibilidade com script.js
    window.supabase = {
      createClient: createClient
    };
    console.log('✅ Supabase conectado com sucesso!');
    
    // Verifica sessão ao carregar - se existir, mantém logado
    // Isso garante que a sessão seja restaurada mesmo após fechar o app
    supabaseClient.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Erro ao verificar sessão:', error);
        return;
      }
      
      if (session) {
        console.log('✅ Sessão encontrada, usuário já está logado:', session.user?.email || 'sem email');
        // A sessão já está ativa, o script.js vai verificar e navegar automaticamente
        // Marca que há sessão para o script.js não mostrar login
        window.hasActiveSession = true;
      } else {
        console.log('ℹ️ Nenhuma sessão encontrada, será necessário fazer login');
        window.hasActiveSession = false;
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:', error);
  }
} else {
  console.warn('⚠️ Supabase não configurado - variáveis de ambiente ausentes');
}

// Configura Deep Linking para OAuth do Supabase
// Captura o token quando o navegador retorna para o app após login OAuth
App.addListener('appUrlOpen', async (event) => {
  console.log('🔗 Deep Link capturado:', event.url);
  
  // Verifica se é uma URL de callback do Supabase
  if (event.url && event.url.includes('capacitor://localhost')) {
    try {
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
        alert(`Erro ao fazer login: ${errorDescription || error}`);
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
          alert(`Erro ao fazer login: ${sessionError.message}`);
          return;
        }
        
        if (sessionData.session) {
          console.log('✅ Sessão OAuth estabelecida com sucesso!', sessionData.session.user?.email);
          
          // Atualiza a variável global currentUser
          window.currentUser = sessionData.session.user;
          window.hasActiveSession = true;
          
          // Dispara evento para o script.js processar
          if (window.verificarAutenticacao) {
            await window.verificarAutenticacao();
          } else {
            console.warn('⚠️ verificarAutenticacao não está disponível ainda');
          }
        } else {
          console.error('❌ Sessão não foi criada');
        }
      } else {
        console.warn('⚠️ Tokens não encontrados na URL:', event.url);
      }
    } catch (error) {
      console.error('❌ Erro ao processar Deep Link:', error);
      alert(`Erro ao processar login: ${error.message}`);
    }
  }
});

console.log('✅ Listener de Deep Linking configurado');

// Importa a lógica principal da aplicação
import '../script.js';

// O HTML já está no index.html, então não precisamos injetar nada
// A lógica da aplicação será carregada através do script.js
