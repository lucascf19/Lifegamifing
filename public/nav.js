/**
 * Lista de páginas do app para a navegação inferior.
 * - nome: rótulo exibido
 * - arquivo: alvo do link (pode incluir âncora, ex: "index.html#inventory-page")
 * - icone: emoji exibido no botão
 */
const PAGINAS_APP = [
  { nome: 'Dashboard',   arquivo: 'index.html',                 icone: '🏰' },
  { nome: 'Missões',     arquivo: 'missoes.html',               icone: '⚔️' },
  { nome: 'Inventário',  arquivo: 'index.html#inventory-page',  icone: '🎒' },
  { nome: 'Estatísticas',arquivo: 'index.html#stats-page',      icone: '📊' },
  { nome: 'Perfil',      arquivo: 'perfil.html',                icone: '👤' },
];

/**
 * Renderiza dinamicamente a navegação inferior com base em PAGINAS_APP.
 * - Usa <a> para navegação real entre arquivos HTML.
 * - Destaca a página atual (classe .active + text-white).
 */
function renderizarNavegacao() {
  try {
    // Procura primeiro pelo novo nav com id="bottom-nav"
    const nav = document.getElementById('bottom-nav') || document.querySelector('nav.bottom-nav');
    if (!nav) {
      return;
    }

    // Caminho atual (ex.: "/index.html", "/missoes.html", "/index.html#inventory-page")
    const pathname = window.location.pathname || '';
    const hash = window.location.hash || '';
    const atual = `${pathname}${hash}`;

    // Container interno da nav
    const container = document.createElement('div');
    container.className = 'flex items-center justify-around h-16';

    PAGINAS_APP.forEach(pagina => {
      const link = document.createElement('a');
      link.href = pagina.arquivo;
      link.className = 'nav-icon nav-bottom-btn flex flex-col items-center justify-center gap-1.5 text-gray-200 hover:text-white transition-colors';
      link.style.minWidth = '28px';
      link.style.minHeight = '28px';

      const spanIcon = document.createElement('span');
      spanIcon.className = 'text-2xl';
      spanIcon.textContent = pagina.icone;

      const spanLabel = document.createElement('span');
      spanLabel.className = 'text-xs font-medium';
      spanLabel.textContent = pagina.nome;

      link.appendChild(spanIcon);
      link.appendChild(spanLabel);

      const alvo = pagina.arquivo;
      const alvoBase = alvo.split('#')[0];

      const ehIndexRoot =
        alvo === 'index.html' &&
        (pathname === '/' || pathname === '' || pathname.endsWith('/index.html'));

      if (ehIndexRoot || atual.endsWith(alvo) || pathname.endsWith(alvoBase)) {
        link.classList.add('active', 'text-white');
      }

      container.appendChild(link);
    });

    // Limpa conteúdo atual e injeta o novo
    while (nav.firstChild) {
      nav.removeChild(nav.firstChild);
    }
    nav.appendChild(container);

    // Expõe globalmente caso seja necessário re-renderizar manualmente
    window.renderizarNavegacao = renderizarNavegacao;
  } catch (e) {
    console.warn('⚠️ Erro ao renderizar navegação inferior:', e);
  }
}

// Renderiza assim que o DOM estiver pronto
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderizarNavegacao();
    });
  } else {
    renderizarNavegacao();
  }
}

