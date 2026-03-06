import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente de forma explícita para todos os modos (dev, build Capacitor, etc.)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // IMPORTANTE: base: './' é vital para o Capacitor não dar tela branca
    // Usa caminhos relativos em vez de absolutos
    base: './',
    // Garante que apenas variáveis que começam com VITE_ sejam expostas
    envPrefix: 'VITE_',
    // Injeta explicitamente as variáveis do Supabase no bundle final
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || '')
    },
  build: {
      // O Capacitor geralmente espera 'dist' ou 'www'
      // Verifique o capacitor.config para confirmar
    outDir: 'dist',
    assetsDir: 'assets',
      // Gera sourcemaps para debug (pode desativar em produção)
      sourcemap: false,
      // Otimizações para produção
      minify: 'esbuild',
    rollupOptions: {
      input: {
        main: './index.html'
        },
        output: {
          // Garante que os assets usem caminhos relativos
          assetFileNames: 'assets/[name].[ext]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name].js'
        }
      }
    },
    // Configurações do servidor de desenvolvimento
    server: {
      port: 5173,
      host: true // Permite acesso de outros dispositivos na rede
    }
  }
})