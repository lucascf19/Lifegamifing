import { useState } from 'react';
import { getSupabaseClient } from './main';

/**
 * Componente de Login
 * Gerencia autenticação com email e senha
 */
export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('usuario@app.com');
  const [password, setPassword] = useState('senha123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Função de login com email e senha
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔐 Botão de login clicado');
    console.log('🚀 Função handleLogin chamada');
    
    // Validação
    if (!email || !email.includes('@')) {
      console.warn('⚠️ E-mail inválido:', email);
      setError('Por favor, insira um e-mail válido');
      return;
    }
    
    if (!password || password.length < 3) {
      console.warn('⚠️ Senha inválida (mínimo 3 caracteres)');
      setError('Por favor, insira uma senha válida');
      return;
    }
    
    // Aguarda um pouco se o Supabase ainda não estiver disponível
    let client = getSupabaseClient();
    if (!client) {
      console.warn('⚠️ Supabase não disponível imediatamente, aguardando...');
      // Tenta novamente após um delay
      await new Promise(resolve => setTimeout(resolve, 500));
      client = getSupabaseClient();
      
      if (!client) {
        console.error('❌ Supabase não configurado após delay');
        setError('Erro: Supabase não está disponível. Tente novamente.');
        setLoading(false);
        return;
      }
    }
    
    console.log('✅ Supabase client obtido:', !!client);
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    console.log('📧 Tentando login com:', email);
    console.log('🔑 Senha fornecida:', password ? '***' : 'vazia');
    
    try {
      console.log('🔄 Tentando fazer login com Supabase...');
      
      // Tenta fazer login com email e senha
      const { data, error: loginError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      
      console.log('📥 Resposta do servidor:', { 
        hasData: !!data, 
        hasError: !!loginError,
        errorCode: loginError?.status || loginError?.code,
        errorMessage: loginError?.message 
      });
      
      if (loginError) {
        console.error('❌ Erro no login:', loginError);
        console.error('Código do erro:', loginError.status || loginError.code);
        console.error('Mensagem do erro:', loginError.message);
        
        // Se o usuário não existir, tenta criar
        if (loginError.message?.includes('Invalid login credentials') || 
            loginError.message?.includes('User not found')) {
          console.log('👤 Usuário não encontrado, tentando criar...');
          
          // Cria o usuário
          // IMPORTANTE: Se o Supabase tiver "Confirm Email" ativado, o usuário precisará confirmar o email
          // Para desenvolvimento, desative "Confirm Email" nas configurações do Supabase (Authentication > Settings)
          const { data: signUpData, error: signUpError } = await client.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
              emailRedirectTo: window.location.origin + window.location.pathname,
              // Se o email não precisar de confirmação, o usuário já estará logado
              // Caso contrário, será necessário confirmar o email primeiro
            }
          });
          
          console.log('📥 Resposta do signUp:', { 
            hasData: !!signUpData, 
            hasError: !!signUpError,
            hasUser: !!signUpData?.user,
            hasSession: !!signUpData?.session,
            needsEmailConfirmation: !signUpData?.session && !!signUpData?.user
          });
          
          if (signUpError) {
            console.error('❌ Erro ao criar usuário:', signUpError);
            throw signUpError;
          }
          
          // Se o signUp criou uma sessão automaticamente (email confirmation desativado)
          if (signUpData.session) {
            console.log('%c✅ Usuário criado e logado automaticamente!', 'color: #10b981; font-weight: bold;');
            
            // LOGIN SILENCIOSO: Apenas log e callback, sem window.verificarAutenticacao
            console.log('LOGIN_OK');
            
            // Define variáveis globais para evitar tela preta de carregamento infinito
            if (typeof window !== 'undefined') {
              window.dashboardDataLoaded = true;
              window.missionsDataLoaded = window.missionsDataLoaded || false;
              console.log('✅ Variáveis globais definidas: dashboardDataLoaded = true');
            }
            
            // Chama callback de sucesso
            if (onLoginSuccess) {
              try {
                onLoginSuccess();
                console.log('✅ Callback onLoginSuccess executado');
              } catch (callbackError) {
                console.error('❌ Erro no callback onLoginSuccess:', callbackError);
              }
            }
            
            setSuccess(true);
            setLoading(false);
            return; // Retorna aqui para evitar executar o código abaixo novamente
          } 
          // Se criou usuário mas precisa confirmar email
          else if (signUpData.user && !signUpData.session) {
            console.warn('⚠️ Usuário criado, mas precisa confirmar email');
            throw new Error('Por favor, verifique seu email e confirme sua conta antes de fazer login. Se o problema persistir, verifique se "Confirm Email" está desativado no Supabase (Authentication > Settings).');
          }
          // Se criou com sucesso mas não tem sessão, tenta fazer login
          else if (signUpData.user) {
            console.log('✅ Usuário criado, tentando fazer login...');
            const { data: loginData, error: loginErrorAfterSignUp } = await client.auth.signInWithPassword({
              email: email.trim(),
              password: password.trim()
            });
            
            console.log('📥 Resposta do login após signUp:', { 
              hasData: !!loginData, 
              hasError: !!loginErrorAfterSignUp,
              hasSession: !!loginData?.session
            });
            
            if (loginErrorAfterSignUp) {
              console.error('❌ Erro ao fazer login após criar usuário:', loginErrorAfterSignUp);
              throw loginErrorAfterSignUp;
            }
            
            if (!loginData.session) {
              throw new Error('Login realizado, mas nenhuma sessão foi criada. Verifique as configurações do Supabase.');
            }
            
            console.log('%c✅ Usuário criado e logado com sucesso!', 'color: #10b981; font-weight: bold;');
            
            // LOGIN SILENCIOSO: Apenas log e callback, sem window.verificarAutenticacao
            console.log('🟢 [Login.jsx] LOGIN_OK - SignUp + Login manual');
            console.log('📋 [Login.jsx] Dados:', { hasUser: !!loginData?.user, hasSession: !!loginData?.session });
            
            // Define variáveis globais para evitar tela preta de carregamento infinito
            if (typeof window !== 'undefined') {
              window.dashboardDataLoaded = true;
              window.missionsDataLoaded = window.missionsDataLoaded || false;
              console.log('✅ [Login.jsx] Variáveis globais definidas');
            }
            
            // Chama callback de sucesso
            if (onLoginSuccess) {
              try {
                console.log('🔄 [Login.jsx] Chamando onLoginSuccess (signUp+login)...');
                onLoginSuccess();
                console.log('✅ [Login.jsx] onLoginSuccess executado');
              } catch (callbackError) {
                console.error('❌ [Login.jsx] Erro no callback:', callbackError);
              }
            } else {
              console.error('❌ [Login.jsx] onLoginSuccess não definido!');
            }
            
            setSuccess(true);
            setLoading(false);
            console.log('✅ [Login.jsx] Estado atualizado: success=true, loading=false');
            return; // Retorna aqui para evitar executar o código abaixo novamente
          }
        } else {
          // Outros erros (401, 500, etc)
          console.error('❌ Erro de autenticação:', loginError.status || loginError.code, loginError.message);
          throw loginError;
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
      
      // LOGIN SILENCIOSO: Apenas log e callback, sem window.verificarAutenticacao
      console.log('🟢 [Login.jsx] LOGIN_OK - Login direto bem-sucedido');
      console.log('📋 [Login.jsx] Dados:', { hasUser: !!data?.user, hasSession: !!data?.session, userId: data?.user?.id });
      
      // Define variáveis globais para evitar tela preta de carregamento infinito
      if (typeof window !== 'undefined') {
        window.dashboardDataLoaded = true;
        window.missionsDataLoaded = window.missionsDataLoaded || false;
        console.log('✅ [Login.jsx] Variáveis globais definidas');
      } else {
        console.error('❌ [Login.jsx] window não disponível!');
      }
      
      console.log('🔄 [Login.jsx] Chamando callback onLoginSuccess...');
      
      // Chama callback de sucesso - o componente pai (App.jsx) decide o que fazer
      // REMOVIDO: dependência de window.verificarAutenticacao
      if (onLoginSuccess) {
        try {
          console.log('📋 [Login.jsx] Tipo do callback:', typeof onLoginSuccess);
          onLoginSuccess();
          console.log('✅ [Login.jsx] onLoginSuccess executado com sucesso');
        } catch (callbackError) {
          console.error('❌ [Login.jsx] Erro no callback:', callbackError);
          console.error('❌ [Login.jsx] Stack:', callbackError.stack);
        }
      } else {
        console.error('❌ [Login.jsx] onLoginSuccess não fornecido!');
      }
      
      setSuccess(true);
      setLoading(false);
      
      // O App.jsx vai gerenciar a verificação de autenticação via onAuthStateChange
      
    } catch (error) {
      // DETALHE_ERRO: Captura informações completas do erro
      console.error('DETALHE_ERRO:', error.message, error.status);
      console.error('❌ Erro ao fazer login (catch):', error);
      console.error('Tipo do erro:', typeof error);
      console.error('Código do erro:', error.status || error.code || 'N/A');
      console.error('Mensagem do erro:', error.message || 'Erro desconhecido');
      console.error('Stack trace:', error.stack);
      
      // Feedback visual de erro
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
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  /**
   * Handler para tecla Enter
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 9999 }}>
      <div className="w-full max-w-md" style={{ position: 'relative', zIndex: 10000 }}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold mb-2">Bem-vindo!</h1>
          <p className="text-gray-400">Entre com seu e-mail para começar</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <input 
              type="email" 
              id="loginEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <div>
            <input 
              type="password" 
              id="loginPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Senha"
              className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔘 Botão Entrar clicado');
              handleLogin(e);
            }}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-semibold transition-colors min-h-[48px] relative z-10"
            style={{ pointerEvents: loading ? 'none' : 'auto' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          
          {error && (
            <div className="text-center text-sm text-red-400">
              {error}
            </div>
          )}
          
          {success && (
            <div className="text-center">
              <div className="text-green-400 mb-2 text-2xl">✓</div>
              <p className="text-gray-300 font-medium">Verifique seu e-mail e clique no link para entrar!</p>
              <p className="text-gray-400 text-xs mt-2">O link expira em 1 hora</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
