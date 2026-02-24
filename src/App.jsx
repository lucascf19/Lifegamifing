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
  
  // Estado de inicialização: começa carregando, não autenticado, sem mostrar login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false); // Começa false, será definido após verificação
  const authCheckedRef = useRef(false); // Ref para garantir que checkAuth só rode uma vez

  // Check de Montagem - verifica se o componente React está montando
  useEffect(() => {
    console.log('[APP.JSX] APP MOUNTED');
    return () => {
      console.log('[APP.JSX] APP UNMOUNTED');
    };
  }, []);

  /**
   * Verifica se o usuário está autenticado
   * Executa apenas uma vez para evitar loops
   */
  const checkAuth = async () => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        console.warn('[APP.JSX] Supabase não configurado');
        setShowLogin(true);
        setIsLoading(false);
        return;
      }

      const { data: { session }, error } = await client.auth.getSession();
      
      if (error) {
        console.error('[APP.JSX] Erro ao verificar sessão:', error);
        setShowLogin(true);
        setIsLoading(false);
        return;
      }

      if (!session || !session.user) {
        console.log('[APP.JSX] Nenhuma sessão encontrada - mostrando login');
        setShowLogin(true);
        setIsLoading(false);
        return;
      }

      // Verifica se o perfil existe antes de autenticar
      try {
        const { data: profile, error: profileError } = await client
          .from('profiles')
          .select('id, nome_usuario')
          .eq('id', session.user.id)
          .single();
        
        if (profileError || !profile) {
          console.log('[APP.JSX] Sessão encontrada mas perfil não existe - mostrando login');
          setShowLogin(true);
          setIsLoading(false);
          return;
        }
        
        console.log('[APP.JSX] Sessão e perfil válidos - autenticando');
        setIsAuthenticated(true);
        setShowLogin(false);
        setIsLoading(false);
        
        // Chama verificarAutenticacao do script.js se disponível (sem await para não travar)
        if (window.verificarAutenticacao) {
          window.verificarAutenticacao().catch(err => {
            console.warn('[APP.JSX] Erro ao verificar autenticação (não bloqueante):', err);
          });
        }
      } catch (profileCheckError) {
        console.error('[APP.JSX] Erro ao verificar perfil:', profileCheckError);
        setShowLogin(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[APP.JSX] Erro ao verificar autenticação:', error);
      setShowLogin(true);
      setIsLoading(false);
    }
  };

  // Usa useCallback para evitar re-criação da função a cada render (previne re-renders)
  // IMPORTANTE: useCallback deve ser chamado ANTES de qualquer return condicional
  const handleLoginSuccess = useCallback(() => {
    console.log('[APP.JSX] onLoginSuccess chamado');
    
    // Atualiza estado imediatamente
    setIsAuthenticated(true);
    setShowLogin(false);
    
    // Garante que dashboardDataLoaded está true para não bloquear
    if (typeof window !== 'undefined') {
      window.dashboardDataLoaded = true;
      window.missionsDataLoaded = window.missionsDataLoaded || false;
    }
    
    // Aguarda um pouco para garantir que o DOM está pronto, depois chama verificarAutenticacao
    setTimeout(() => {
      if (window.verificarAutenticacao) {
        window.verificarAutenticacao().catch(err => {
          console.error('[APP.JSX] Erro ao verificar autenticação:', err);
        });
      }
    }, 100);
  }, []);

  useEffect(() => {
    // Garante que só roda uma vez
    if (authCheckedRef.current) {
      return;
    }
    
    // Garante que só roda quando isLoading é true
    if (isLoading === false) {
      return;
    }
    
    authCheckedRef.current = true;
    console.log('[APP.JSX] Iniciando verificação de autenticação...');
    checkAuth();
  }, [isLoading]); // Só depende de isLoading

  // Renderização condicional limpa e sequencial
  if (isLoading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#999' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (showLogin) {
    console.log('[APP.JSX] Renderizando Login');
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (isAuthenticated) {
    console.log('[APP.JSX] Usuário autenticado - script.js gerencia o resto');
    return <div style={{ display: 'none' }} />;
  }

  // Fallback: se chegou aqui, mostra login por segurança
  console.log('[APP.JSX] Fallback - mostrando Login');
  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;
