import React, { useState, useEffect, useCallback } from 'react';
import Login from './Login';
import { getSupabaseClient } from './main';
import './App.css';

/**
 * Componente principal da aplicação
 * Gerencia o estado de autenticação e renderiza Login ou App
 */
function App() {
  console.log('[APP.JSX] APP COMPONENT RENDERING');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);

  // Check de Montagem - verifica se o componente React está montando
  useEffect(() => {
    console.log('[APP.JSX] APP MOUNTED');
    return () => {
      console.log('[APP.JSX] APP UNMOUNTED');
    };
  }, []);

  /**
   * Verifica se o usuário está autenticado
   */
  const checkAuth = async () => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.warn('[APP.JSX] Supabase não configurado');
        setIsLoading(false);
        return;
      }

      const { data: { session }, error } = await client.auth.getSession();
      
      if (error) {
        console.error('[APP.JSX] Erro ao verificar sessão:', error);
        setIsAuthenticated(false);
        setShowLogin(true);
        setIsLoading(false);
        return;
      }

      if (session) {
        console.log('[APP.JSX] Sessão encontrada:', session.user?.email);
        setIsAuthenticated(true);
        setShowLogin(false);
        
        // Chama verificarAutenticacao do script.js se disponível (sem await para não travar)
        if (window.verificarAutenticacao) {
          window.verificarAutenticacao().catch(err => {
            console.warn('[APP.JSX] Erro ao verificar autenticação (não bloqueante):', err);
          });
        }
      } else {
        console.log('[APP.JSX] Nenhuma sessão encontrada');
        setIsAuthenticated(false);
        setShowLogin(true);
      }
    } catch (error) {
      console.error('[APP.JSX] Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
      setShowLogin(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Usa useCallback para evitar re-criação da função a cada render (previne re-renders)
  // IMPORTANTE: useCallback deve ser chamado ANTES de qualquer return condicional
  const handleLoginSuccess = useCallback(async () => {
    console.log('[APP.JSX] onLoginSuccess chamado');
    setIsAuthenticated(true);
    setShowLogin(false);
    
    // Garante que dashboardDataLoaded está true para não bloquear
    if (typeof window !== 'undefined') {
      window.dashboardDataLoaded = true;
      window.missionsDataLoaded = window.missionsDataLoaded || false;
    }
    
    // Aguarda um pouco para garantir que o DOM está pronto
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Chama verificarAutenticacao do script.js para mostrar a tela correta
    if (window.verificarAutenticacao) {
      try {
        await window.verificarAutenticacao();
      } catch (err) {
        console.error('[APP.JSX] Erro ao verificar autenticação:', err);
      }
    } else {
      // Tenta novamente após um delay
      setTimeout(() => {
        if (window.verificarAutenticacao) {
          window.verificarAutenticacao().catch(err => {
            console.error('[APP.JSX] Erro ao verificar autenticação (retry):', err);
          });
        }
      }, 500);
    }
  }, []); // Array vazio - função não depende de estado

  useEffect(() => {
    // Verifica autenticação ao carregar
    checkAuth();
    
    // Configura listener de mudanças de autenticação
    const client = getSupabaseClient();
    if (client) {
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        console.log('[APP.JSX] Auth state changed:', event, session?.user?.email);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setIsAuthenticated(true);
          setShowLogin(false);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setShowLogin(true);
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#999' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Mostra tela de login se não estiver autenticado
  if (showLogin || !isAuthenticated) {
    console.log('[APP.JSX] Renderizando Login');
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Se autenticado, o script.js gerencia o resto da UI
  console.log('[APP.JSX] Usuário autenticado - renderizando componente vazio');
  return <div style={{ display: 'none' }} />;
}

export default App;
