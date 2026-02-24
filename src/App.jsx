import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './Login';
import { getSupabaseClient } from './main';
import './App.css';

/**
 * Componente principal da aplicação
 * Gerencia o estado de autenticação e renderiza Login ou App
 */
function App() {
  console.log('[APP.JSX] APP COMPONENT RENDERING');

  // Estado de inicialização/guard
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState(null);

  // Check de Montagem - verifica se o componente React está montando
  useEffect(() => {
    console.log('[APP.JSX] APP MOUNTED');
    return () => {
      console.log('[APP.JSX] APP UNMOUNTED');
    };
  }, []);

  // Callback de sucesso do Login: apenas loga e deixa o onAuthStateChange cuidar do resto
  const handleLoginSuccess = useCallback(() => {
    console.log('[APP.JSX] onLoginSuccess chamado - sessão será atualizada via onAuthStateChange do Supabase');
  }, []);

  useEffect(() => {
    console.log('[APP.JSX] Iniciando guard de autenticação (useEffect)');

    const client = getSupabaseClient();
    if (!client) {
      console.warn('[APP.JSX] Supabase não configurado - forçando Login');
      setSession(null);
      setInitializing(false);
      return;
    }

    // Usa window.hasActiveSession, definido em main.jsx na inicialização do Supabase,
    // como ponto de partida para o Guard.
    if (typeof window !== 'undefined' && window.hasActiveSession === false) {
      console.log('[APP.JSX] Guard: window.hasActiveSession == false - forçando Login e bloqueando navegação privada');
      setSession(null);
      setInitializing(false);
      return;
    }

    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data, error } = await client.auth.getSession();

        if (!isMounted) return;

        console.log('[APP.JSX] getSession inicial:', {
          hasSession: !!data?.session,
          userId: data?.session?.user?.id,
          email: data?.session?.user?.email,
          error: error ? error.message : null
        });

        if (error) {
          console.error('[APP.JSX] Erro ao obter sessão inicial:', error);
          setSession(null);
        } else {
          setSession(data?.session || null);
        }
      } catch (e) {
        if (!isMounted) return;
        console.error('[APP.JSX] Exceção em initAuth:', e);
        setSession(null);
      } finally {
        if (isMounted) {
          console.log('[APP.JSX] Finalizando estado de inicialização');
          setInitializing(false);
        }
      }
    };

    // Executa inicialização
    initAuth();

    // Listener de mudanças de autenticação
    let subscription;
    try {
      const { data } = client.auth.onAuthStateChange((event, newSession) => {
        if (!isMounted) return;
        console.log('[APP.JSX] Evento Auth:', event, newSession?.user?.email);

        // Evita re-render desnecessário:
        // se o Supabase só está confirmando que NÃO há sessão,
        // e isso já foi verificado pelo getSession inicial, ignoramos.
        if (event === 'INITIAL_SESSION' && !newSession) {
          return;
        }

        setSession(newSession || null);
      });
      subscription = data?.subscription || data;
    } catch (listenerError) {
      console.error('[APP.JSX] Erro ao registrar onAuthStateChange:', listenerError);
    }

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try {
          subscription.unsubscribe();
        } catch (unsubscribeError) {
          console.warn('[APP.JSX] Erro ao desinscrever onAuthStateChange:', unsubscribeError);
        }
      }
    };
  }, []);

  // Quando a sessão ficar válida, dispara a verificação do script.js
  useEffect(() => {
    if (!session) return;

    console.log('[APP.JSX] Sessão válida detectada - disparando verificarAutenticacao do script.js');
    if (typeof window !== 'undefined' && window.verificarAutenticacao) {
      window.verificarAutenticacao().catch(err => {
        console.warn('[APP.JSX] Erro ao chamar verificarAutenticacao:', err);
      });
    }
  }, [session]);

  // 1) Estado de carregamento inicial: Splash / tela preta
  if (initializing) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#999' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // 2) Guard: sem sessão → única rota acessível é Login
  if (!session) {
    console.log('[APP.JSX] Guard: nenhuma sessão - renderizando Login');
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 3) Sessão válida: expõe containers para o script.js trabalhar
  if (session) {
    console.log('[APP.JSX] Sessão ativa - Renderizando containers principais para script.js');
    return (
      <div id="main-wrapper">
        {/* O script.js antigo pode procurar por estes IDs para injetar HTML */}
        <div id="dashboard"></div>
        <div id="lista-missoes"></div>
        {/* Adicione aqui outros IDs que o script.js usar como raiz de injeção */}
      </div>
    );
  }
}
export default App;