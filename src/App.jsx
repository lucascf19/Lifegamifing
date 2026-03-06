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

  // Guard de Autenticação Simplificado
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setInitializing(false);
      return;
    }

    // Monitora mudanças na sessão
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      console.log('[APP.JSX] Evento Auth:', event, session?.user?.email);
      
      // Garante que quando o evento for SIGNED_OUT, a session seja null
      if (event === 'SIGNED_OUT') {
        console.log('[APP.JSX] Usuário deslogado, definindo session como null');
        setSession(null);
        setInitializing(false);
        return;
      }
      
      setSession(session);
      setInitializing(false);

      if (session) {
        // Tenta chamar a verificação global
        if (typeof window.verificarAutenticacao === 'function') {
          console.log('[APP.JSX] Usuário logado, verificando personagem...');
          window.verificarAutenticacao();
        } else {
          // Se o script demorar, espera o evento
          console.log('[APP.JSX] Aguardando script.js carregar...');
          window.addEventListener('RPG_SCRIPT_READY', () => {
            console.log('[APP.JSX] Script pronto, verificando personagem...');
            if (typeof window.verificarAutenticacao === 'function') {
              window.verificarAutenticacao();
            }
          }, { once: true });
        }
      }
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Limpeza de UI: garante que o login nativo não interfira na criação
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const loginScreen = document.getElementById('loginScreen');
    const creationScreen = document.getElementById('characterCreationScreen');

    // Se existir sessão ou a tela de criação estiver visível, desabilita interações do login estático
    if (session || (creationScreen && !creationScreen.classList.contains('hidden'))) {
      if (loginScreen) {
        loginScreen.style.display = 'none';
        loginScreen.style.pointerEvents = 'none';
      }
    }
  }, [session]);


  // Log de debug para entender o estado do Guard antes de decidir o retorno
  console.log('[DEBUG] Estado atual:', { initializing, session: !!session });

  // 1) Estado de carregamento inicial: Splash / tela preta
  // MODIFICADO: Garantir que não bloqueie cliques quando não estiver ativo
  if (initializing) {
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: '#000', 
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        pointerEvents: 'auto' // Permite cliques apenas quando está ativo
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#999' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // 2) Guard: sem sessão → única rota acessível é Login
  if (!session) {
    return (
      <div
        id="login-container"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: '#000',
        }}
      >
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 3) Sessão válida: não renderiza nada do React, deixa o HTML do index.html aparecer
  if (session) {
    return null;
  }
}
export default App;