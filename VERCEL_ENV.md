# Configuração de Variáveis de Ambiente na Vercel

Este documento explica como configurar as variáveis de ambiente do Supabase na Vercel.

## Variáveis Necessárias

Configure as seguintes variáveis de ambiente no painel da Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` - URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima (anon key) do Supabase

## Como Configurar na Vercel

1. Acesse o painel da Vercel: https://vercel.com
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as variáveis:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://seu-projeto.supabase.co`
   - **Environment**: Production, Preview, Development (marque todos)
   
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `sua-chave-anon-aqui`a
   - **Environment**: Production, Preview, Development (marque todos)

5. Clique em **Save**

## Como Obter os Valores

### SUPABASE_URL
1. Acesse https://supabase.com
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie o valor de **Project URL**

### SUPABASE_ANON_KEY
1. No mesmo local (Settings → API)
2. Copie o valor de **anon public** key

## Ordem de Prioridade

O `script.js` tenta carregar as variáveis na seguinte ordem:

1. `window.__ENV__.NEXT_PUBLIC_SUPABASE_URL` (Vercel)
2. `process.env.NEXT_PUBLIC_SUPABASE_URL` (Node.js)
3. `import.meta.env.VITE_SUPABASE_URL` (Vite)
4. `window.SUPABASE_CONFIG.url` (config.js - fallback local)
5. Valor padrão (não recomendado)

## Desenvolvimento Local

Para desenvolvimento local, você pode:

1. **Opção 1**: Usar o arquivo `config.js` (já configurado)
2. **Opção 2**: Criar um arquivo `.env.local` com:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

## Nota Importante

- Variáveis que começam com `NEXT_PUBLIC_` são expostas ao cliente (browser)
- Não coloque informações sensíveis (como service_role key) em variáveis públicas
- A `anon key` é segura para uso no cliente, pois as políticas RLS protegem os dados
